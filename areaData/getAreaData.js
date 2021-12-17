const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const getGATData = () => {
    const txMapJson = require('./txMaplist.json');
	const cityList = txMapJson.result[1];
	const areaList = txMapJson.result[2];
	
    let cityMap = {
		'810000': [{
			code: '810100',
			name: '香港特别行政区',
			area: []
		}],
		'820000': [{
			code: '820100',
			name: '澳门特别行政区',
			area: []
		}]
	};

	Object.keys(cityMap).forEach((item) => {
		cityMap[item][0].area = cityList.filter((city) => city.id.substr(0, 2) === item.substr(0, 2)).map((city) => ({
			code: city.id,
			name: city.fullname,
		}));
	});

	cityMap['710000'] = cityList.filter((city) => city.id.substr(0,2) === '71').map((city) => {
			const areaArr = areaList.filter((area) => area.id.substr(0, 4) === city.id.substr(0, 4)).map((area) => ({
				code: area.id,
				name: area.fullname,
			}));
			return {
				code: city.id,
				name: city.fullname,
				area: areaArr,
			};
		});
	return cityMap;
}

function to(promise) {
    return promise.then(data => {
       return [null, data];
    })
    .catch(err => [err]);
 }


(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.on('pageerror', (err) => {
    console.log('====err', err);
  })
  const gatData = getGATData();
  await page.goto('http://www.mca.gov.cn/article/sj/xzqh/2020/2020/202101041104.html',  {
        waitUntil: 'networkidle2',
  });
  const dimensions = await page.evaluate(() => {
        const data = [];
        const trList = document.getElementsByTagName('tr');
        for(const tr of trList) {
            const tdList = tr.getElementsByTagName('td');
            if (tdList[1] && tdList[2]) {
                const regionCode = tdList[1].innerHTML;
                const tdChildNodes =  tdList[2].childNodes;
                let region = '';
                if (tdChildNodes.length === 2) {
                    region = tdChildNodes[1].nodeValue;
                } else if (tdChildNodes.length === 1){
                    region = tdChildNodes[0].nodeValue;
                }
                if (regionCode && region && !isNaN(Number(regionCode))) {
                    const pr = regionCode.substr(0, 2);
                    const ci = regionCode.substr(0, 4);
                    if (regionCode === (pr + '0000')) { // 一级行政区
                        if (['110000', '120000', '310000', '500000'].indexOf(regionCode) > -1) { // 4个直辖市，没有二级行政区，要特殊处理
                            data.push({
                                code: regionCode,
                                name: region,
                                city: [{
                                    code: pr + '0100',
                                    name: region,
                                    area: []
                                }]
                            })
                        } else {
                            data.push({
                                code: regionCode,
                                name: region,
                                city: []
                            })
                        }
                    } else if (regionCode === (ci + '00')) { // 二级行政区
                        const index = data.findIndex((item) => item.code.substr(0, 2) === pr);
                        data[index].city.push({
                            code: regionCode,
                            name: region,
                            area: []
                        });
                    } else { // 三级行政区
                        const pIndex = data.findIndex((item) => item.code.substr(0, 2) === pr);
                        const cIndex = data[pIndex].city.findIndex((item) => item.code.substr(0, 4) === ci);
                        if (cIndex === -1) { // 省直辖县级行政区划
                            data[pIndex].city.push({
                                code: ci + '00',
                                name: '省直辖县级行政区划',
                                area: [{
                                    code: regionCode,
                                    name: region,
                                }]
                            });
                        } else {
                            data[pIndex].city[cIndex].area.push({
                                code: regionCode,
                                name: region,
                            });
                        }
                    }
                } 
            }
        }
        return data;
  });


  for (const province of dimensions) {
        if (['710000', '810000', '820000'].indexOf(province.code) > -1) {
            province.city = gatData[province.code];
        } else {
            await (async function() {
                for (const city of province.city) {
                    if (city.area.length === 0) {
                        console.log('=====city', city);
                        const [err, subPage] = await to(browser.newPage());
                        if(err) {
                            console.log('err===', err);
                        }
                        subPage.on('pageerror', (err) => {
                            console.log('==subPage==err', err);
                        })
                        const [gotoErr, result] = await to(subPage.goto(`http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2020/${city.code.substr(0,2)}/${city.code.substr(0,4)}.html`));
                        if(gotoErr) {
                            console.log('gotoErr===', gotoErr);
                        }
                        const areaList = await subPage.evaluate((city) => {
                            const townArr = [];
                            let index = 1;
                            const townList = document.getElementsByClassName('towntr');
                            for(const town of townList) {
                                const text = town.getElementsByTagName('a')[1].innerHTML;
                                townArr.push({
                                    code: index < 10 ? `${city.code.substr(0, 5)}${index}` : `${city.code.substr(0, 4)}${index}`,
                                    name: text,
                                });
                                index ++;
                            };
                            return townArr;
                        }, city);
                        city.area = areaList;
                    }
                }
            })();
        }
    };

    fs.writeFileSync(path.join(__dirname, './areaData.json'), JSON.stringify(dimensions));
    await browser.close();

})();
