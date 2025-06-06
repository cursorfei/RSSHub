import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';
import timezone from '@/utils/timezone';

function load_detail(list, cache) {
    return Promise.all(
        list.map((item) => {
            const notice_item = load(item);
            const href = notice_item('a').attr('href');
            const url = 'http://www.shmeea.edu.cn' + href;
            if (href[0] !== '/') {
                return {
                    title: notice_item('a').attr('title'),
                    description: `<a href="${href}" >附件</a>`,
                    link: href,
                };
            }
            return cache.tryGet(url, async () => {
                const detail_response = await got({
                    method: 'get',
                    url,
                    headers: {
                        Referer: 'http://www.shmeea.edu.cn/page/04000/index.html',
                        Host: 'www.shmeea.edu.cn',
                    },
                });
                const detail = load(detail_response.data);
                return {
                    title: notice_item('a').attr('title'),
                    description: detail('.Article_content').html(),
                    link: url,
                    pubDate: timezone(parseDate(detail('.PBtime').text(), 'YYYY-MM-DD HH:mm:ss'), +8),
                };
            });
        })
    );
}

export const route: Route = {
    path: '/self-study',
    categories: ['study'],
    example: '/shmeea/self-study',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['www.shmeea.edu.cn/page/04000/index.html', 'www.shmeea.edu.cn/'],
        },
    ],
    name: '自学考试通知公告',
    maintainers: ['h2ws'],
    handler,
    url: 'www.shmeea.edu.cn/page/04000/index.html',
};

async function handler() {
    const response = await got({
        method: 'get',
        url: 'http://www.shmeea.edu.cn/page/04000/index.html',
        headers: {
            Host: 'www.shmeea.edu.cn',
        },
    });

    const data = response.data;

    const $ = load(data);
    const list = $('#main > div.container > div > div.span9 > div.page-he  > div  > ul > li').toArray();

    const detail = await load_detail(list, cache);

    return {
        title: '上海自学考试 - 通知公告',
        link: 'http://www.shmeea.edu.cn/page/04000/index.html',
        item: detail,
    };
}
