// don't think name is needed ??
interface NewsItemChild {
  // name: string;
  value?: string;
}

interface NewsItem {
  name: string;
  children: {
    news_item_title?: NewsItemChild[];
    news_item_url?: NewsItemChild[];
    news_item_source?: NewsItemChild[];
    news_item_picture?: NewsItemChild[];
    news_item_snippet?: NewsItemChild[];
  };
}

interface ExtensionsHT {
  approx_traffic?: NewsItemChild[];
  picture?: NewsItemChild[];
  picture_source?: NewsItemChild[];
  news_item?: NewsItem[];
}

interface Item {
  title?: string;
  link?: string;
  pub_date?: string;
  extensions?: {
    ht?: ExtensionsHT;
  };
}

interface CleanedNews {
  title: string;
  url: string;
  source: string;
  image: string;
}

interface CleanedItem {
  title: string;
  link: string;
  pubDate: string;
  approxTraffic: string;
  // image: string;
  // imageSource: string;
  news: CleanedNews[];
}

export default function transformTrendData(item: Item): CleanedItem {
  const ht = item.extensions?.ht || {};
  const newsItems = ht.news_item || [];

  return {
    title: item.title || "",
    link: item.link || "",
    pubDate: item.pub_date || "",
    approxTraffic: ht.approx_traffic?.[0]?.value || "",
    // image: ht.picture?.[0]?.value || "",
    // imageSource: ht.picture_source?.[0]?.value || "",
    news: newsItems.map((news) => {
      const children = news.children || {};
      return {
        title: children.news_item_title?.[0]?.value || "",
        url: children.news_item_url?.[0]?.value || "",
        source: children.news_item_source?.[0]?.value || "",
        image: children.news_item_picture?.[0]?.value || "",
      };
    }),
  };
}
