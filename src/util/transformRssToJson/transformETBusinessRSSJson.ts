interface CleanedNewsItems {
	news : CleanedNews [];
}
export interface CleanedNews {
  description: string;
  title: string;
  pubDate: string;
  imageUrl: string;
  newsUrl: string;
}
//--------- accepting type
interface Item { 
    items: InputNewsItem [];
}

interface InputNewsItem {
  description: string;
  enclosure: {
    length: string;
    mime_type: string;
    url: string; //  mapped to imageUrl
  };
  guid: {
    permalink: boolean;
    value: string;
  };
  link: string; //  mapped to newsUrl
  pub_date: string; // publishing date
  title: string;
}

export default function transformETBusinessData(input: Item): CleanedNewsItems {
  //const newsItems: InputNewsItem [] = items?.items || [];
	const newsItems: InputNewsItem [] = input?.items || [];

  //console.log(newsItems);
  const cleandNewsArray: CleanedNews[] = newsItems.map(
    (inputNews) => {
      // for each inputNews return type is CleanedNews and inputnews type si InputNewsItem
      return {
        description: inputNews.description,
        title: inputNews.title,
        pubDate: inputNews.pub_date,
        imageUrl: inputNews.enclosure.url,
        newsUrl: inputNews.link,
      };
    }
  );
	//console.log(cleandNewsArray);
  return {
    news: cleandNewsArray,
  };
}
