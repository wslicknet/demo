## 小程序地址组件picker数据

需要一份picker地址的源数据，微信没有开源。自己捣鼓一下。

国家民政部：http://www.mca.gov.cn/article/sj/xzqh/2020/2020/202101041104.html

国家统计局：http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2020/

腾讯地图： https://apis.map.qq.com/ws/district/v1/list?key=OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77

社区官方给的说法是：先用中国民政部的数据，但二级（市）行政单位没有三级行政区的（例如：东莞市），用国家统计局的四级行政区代替。（但都没有港澳台数据）。
没有三级行政区的市：

=====city { code: '441900', name: '东莞市', area: [] }

=====city { code: '442000', name: '中山市', area: [] }

=====city { code: '460300', name: '三沙市', area: [] }

=====city { code: '460400', name: '儋州市', area: [] }

=====city { code: '620200', name: '嘉峪关市', area: [] }

用puppeteer实际爬出来的数据有出入：
1. code: '620200', name: '嘉峪关市', 这个城市很特别，微信picker数据与国家统计局不同。
2. 四级行政区的编码（5,6位,01开始，递增）与国家（7,8,9位）不同；
3. 直辖市，微信picker统一改成同名二级行政区：[北京市 北京市]； 
4. 县级直辖市，微信picker统一改成："省直辖县级行政区划"； 
5. 港澳台数据，发现和腾讯地图的数据一致；
6. 可能还有别的？？？？没有细对

总结：数据多少还是有出入，最准确的数据，应该是只能找官方开源的，或者扒小程序picker请求（开发者工具反编译？）。

