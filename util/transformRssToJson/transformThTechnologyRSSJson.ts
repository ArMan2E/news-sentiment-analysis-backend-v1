// ----Accepting type---
interface Item {
  items: InputNewsItem[];
}
export interface InputNewsItem {
  categories: {
    name: string;
  }[];
  description: string;
  extensions: {
    media: {
      content: {
        attrs: {
          height: string;
          medium: string;
          url: string;
          width: string;
        };
        name: string;
      }[];
    };
  };
  guid: {
    permalink: boolean;
    value: string;
  };
  link: string;
  pub_date: string;
  title: string;
}
//--- Return js obj type---
export interface CleanedNewsStruct {
  description: string;
	imageUrl: string;
  newsUrl: string;
  pubDate: string;
	title: string;
}
export interface CleanedNews {
	news: CleanedNewsStruct [];
}
export default function transformThTechnologyData(input: Item): CleanedNews {
  //const newsItems: InputNewsItem [] = items?.items || [];
  const newsItems: InputNewsItem[] = input?.items || [];

  console.log(newsItems);
  const cleandNewsArray: CleanedNewsStruct [] = newsItems.map((inputNews) => {
    // for each inputNews return type is CleanedNews and inputnews type si InputNewsItem
    return {
      description: inputNews.description,
      title: inputNews.title,
      pubDate: inputNews.pub_date,
      imageUrl: inputNews.extensions?.media?.content?.[0]?.attrs.url || "", // at 0th idx of cotent array
      newsUrl: inputNews.link,
    };
  });
  //console.log(cleandNewsArray);
  return {
    news: cleandNewsArray,
  };
}


/**
 * {
      "categories": [
        {
          "name": "Technology"
        }
      ],
      "description": "The ride-hailing platform will deploy 5 fan buses covering routes along several parts of Delhi NCR",
      "extensions": {
        "media": {
          "content": [
            {
              "attrs": {
                "height": "675",
                "medium": "image",
                "url": "https://th-i.thgim.com/public/sci-tech/technology/d9y979/article69452278.ece/alternates/LANDSCAPE_1200/image002.jpg",
                "width": "1200"
              },
              "name": "media:content"
            }
          ]
        }
      },
      "guid": {
        "permalink": false,
        "value": "article-69452251"
      },
      "link": "https://www.thehindu.com/sci-tech/technology/uber-to-offer-free-shuttle-rides-for-ipl-matches-in-delhi-ncr/article69452251.ece",
      "pub_date": "Tue, 15 Apr 2025 15:55:11 +0530",
      "title": "Uber to offer free Shuttle rides for IPL matches in Delhi NCR"
    }
 */