const scrapeIt = require("scrape-it");
const _ = require("lodash");

const url = process.env.SCRAP_URL  || "https://listado.mercadolibre.com.co/xiaomi#D[A:xiaomi]";
const numberOfPages = process.env.SCRAP_NUMBER_PAGES || 5;
let productsArray = [];
let promises=[];

const productScraper = {
    products: {
        listItem: "div.andes-card",
        data: {
            title: "div.ui-search-result__content-wrapper div a",
            originalPrice: "div.ui-search-price del span.price-tag-fraction",
            actualPrice: {
                selector: "div.ui-search-price__second-line span.ui-search-price__part span.price-tag-fraction",
                eq: 0
            },
            discount: ".ui-search-price__discount",
            installments: { 
                selector: "span.ui-search-installments",
                texteq: 0
            },
            installmentsValue: {
                selector: "div.ui-search-price__second-line span.ui-search-price__part span.price-tag-fraction",
                eq: 1
            },
        }
    }
    
};

const paginationLinksScraper = {
    links:{
        listItem: 'li[class^="andes-pagination__button"]',
        data: {
            link: {
                selector: 'a',
                attr: 'href'
            }
        }
    } 
};

const firstPageScraper = {
    ...productScraper,
    ...paginationLinksScraper
};

function scrapUrl(url, scraper){
    console.log("Scraping url: "+url);
    return scrapeIt(url, scraper);
}

function filterProducts(productsArray, property){
    return _.uniqBy(productsArray,property);
}

scrapUrl(url, firstPageScraper).then(({ data, response }) => {
    productsArray = productsArray.concat(data.products);
    const paginationLinks = data.links;
    for(let i=1; i<numberOfPages;i++){
        promises.push(scrapUrl(paginationLinks[i].link, productScraper).then( ({ data, response }) => {
            productsArray = productsArray.concat(data.products);
            return productsArray;
        }));
    }
    Promise.all(promises).then(() => {
        console.log("There are "+productsArray.length+" total items scraped");
        const unique = filterProducts(productsArray, 'title');
        console.log("There are "+unique.length+" unique products");
    });
}).catch((error)=> {
    console.log("There was an error scraping, reason:"+error);
});