# UpComics

Upcoming comic release API gathered by scraping the websites of each of the publishers.

## API

### API Key

A valid API key is needed for all calls. API keys are supplied as a query string, for example:

```
/publisher/marvel?api_key=123456789
```

### URLs

#### Publishers
```
GET /publisher/:publisher
``` 
Retrieve all upcoming releases from the supplied publisher (case-insensitive).

```
GET /publisher/:publisher/count
``` 
Retrieve a count of upcoming releases from the supplied publisher (case-insensitive).

#### Dates
```
GET /today
``` 
Retrieve all releases for the current date

```
GET /today/count
``` 
Retrieve a count for all releases for the current week

```
GET /thisweek
``` 
Retrieve all releases for the current week

```
GET /thisweek/count
``` 
Retrieve a count for all releases for the current date

```
GET /date/:date
``` 
Retrieve all releases for a given date. Dates are best supplied as YYYY/MM/DD

```
GET /date/:date/count
``` 
Retrieve a count for all releases for a given date. Dates are best supplied as YYYY/MM/DD

#### Series
```
GET /series/:series
``` 
Retrieve all upcoming releases from the supplied series (case-insensitive).

```
GET /series/:series/count
``` 
Retrieve a count of upcoming releases from the supplied series (case-insensitive).

#### Advances Search
```
GET /search?[query_string]
``` 
Perform an advanced search over multiple values.

**Query String Values:**

key | description | notes
--- | --- | ---
`release_date` | set the release date of results | defaults to greater than the current date
`release_date_start` | set the earliest release date of results | this overrides `release_date`
`release_date_end` | set the latest release date of results | this overrides `release_date`
`series` | set the series of results
`publisher` | set the publisher of results
`issue` | set the issue number of results
`count` | used to return a number of results rather than the actual results

**Example:**

```
/search?api_key=123456789&publisher=Marvel&release_date=2014/08/27
```
This will return all releases on the 27th August 2014 from Marvel

### Example Response

```
{
	"issue":"24",
	"link":"http://imagecomics.com/comics/releases/thief-of-thieves-24",
	"publisher":"Image",
	"release_date":"2014-09-17",
	"title":"Thief Of Thieves"
}
```