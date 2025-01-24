import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

// 加载环境变量
dotenv.config();

// 从环境变量中获取基础 URL、API Token 和每类文章的最大数量
const baseUrl = process.env.BASE_URL;
const apiToken = process.env.API_TOKEN;
const maxArticlesPerCategory = parseInt(process.env.MAX_ARTICLES_PER_CATEGORY) || 10;  // 默认最大数量为 10

// 设置请求头，包含 API Token
const headers = {
    Authorization: `Bearer ${apiToken}`,
};

/**
 * 异步获取文章帖子数据
 * 此函数从 API 获取文章数据，处理并分类，然后写入文件系统
 */
async function fetchPosts() {
    try {
        // 发起 GET 请求获取数据
        const response = await axios.get(baseUrl, { headers });

        // 检查响应状态
        if (response.status === 200) {
            // 解析基础域名
            const baseDomain = new URL(baseUrl).origin;

            // 获取响应数据中的项目
            const items = response.data.items;

            // 初始化数据，存储“最新”
            const categoriesData = {
                latest: {
                    title: "最新",
                    url: `${baseDomain}/archives`,
                    articles: [],
                },
            };

            // 如果项目存在且为数组，则进行处理
            if (items && Array.isArray(items)) {
                // 按发布日期降序排序项目
                items.sort((a, b) => new Date(b.post.spec.publishTime) - new Date(a.post.spec.publishTime));

                // 遍历每个项目
                items.forEach(item => {
                    const post = item.post.spec;
                    const postTitle = post.title;
                    const postUrl = item.post.status.permalink;
                    const postTime = post.publishTime;
                    const categories = item.categories.map(category => category.spec.displayName);
                    const formattedDate = new Date(postTime).toLocaleDateString();
                    const fullPostUrl = `${baseDomain}${postUrl}`;

                    // 向“最新”分类中添加文章，直到达到最大数量
                    if (categoriesData.latest.articles.length < maxArticlesPerCategory) {
                        categoriesData.latest.articles.push({
                            title: postTitle,
                            url: fullPostUrl,
                            time: formattedDate,
                        });
                    }

                    // 遍历每个分类，创建或更新分类数据
                    categories.forEach(category => {
                        if (!categoriesData[category]) {
                            categoriesData[category] = {
                                title: category,
                                url: `${baseDomain}/categories/${item.categories[0].spec.slug}`,
                                articles: [],
                            };
                        }

                        // 向分类中添加文章，直到达到最大数量
                        if (categoriesData[category].articles.length < maxArticlesPerCategory) {
                            categoriesData[category].articles.push({
                                title: postTitle,
                                url: fullPostUrl,
                                time: formattedDate,
                            });
                        }
                    });
                });
            } else {
                console.error('没有找到 items 数据');
            }

            // 将分类数据转换为数组并调整顺序，将“最新”分类置于首位
            const formattedCategories = Object.values(categoriesData);
            const latestCategory = formattedCategories.shift();
            formattedCategories.unshift(latestCategory);

            // 将分类数据转换为字符串并写入文件
            const outputData = `export default ${JSON.stringify(formattedCategories, null, 2)};`;
            fs.writeFileSync('./src/data/articles_list.ts', outputData, 'utf8');
            console.log('数据已成功写入到 articles_list.ts 文件');
        } else {
            console.error(`请求失败，状态码: ${response.status}`);
        }
    } catch (error) {
        console.error('请求过程中发生错误:', error.message);
    }
}

// 调用函数获取文章数据
fetchPosts().then(r => {}).catch(error => console.error(error));
