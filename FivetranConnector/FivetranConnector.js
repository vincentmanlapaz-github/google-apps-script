/**
 * A Google Apps Script class that connects and performs actions via Fivetran REST API.
 * @class FivetranConnector
 */
class FivetranConnector {
    /**
     * Establishes the basic requirements to connect to Fivetran REST API.
     * @param {string} apiKey         - The API key generated for a user.
     * @param {string} apiSecret      - The API secret for a user.
     * @param {number} [apiVersion=1] - The API version to use when retrieving responses from Fivetran.
     *                                  If no argument is passed, defaults to 1.
     */
    constructor(apiKey, apiSecret, apiVersion) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.apiVersion = apiVersion || 1;

        this.baseUrl = `https://api.fivetran.com/v1`;
        this._authHeader = this.authenticator_();
    }

    /**
     * Generates the `Authorization` header to connect to Fivetran REST API.
     * @method authenticator_
     * @returns {Object} The `Authorization` header when making API calls.
     */
    authenticator_() {
        const base64AuthKey = Utilities.base64Encode(`${this.apiKey}:${this.apiSecret}`);
        return {"Authorization": `Basic ${base64AuthKey}`};
    }

    /**
     * Performs a call to the API service and generates a success or error Logger message.
     * @method makeCallToApi_
     * @params {string} url        - The URL to make an API call to.
     * @params {Object} httpParams - Contains the method, headers, and payload, if required.
     * @returns {UrlFetchApp.HTTPResponse}
     */
    makeCallToApi_(url, httpParams) {
        let httpResponse = UrlFetchApp.fetch(url, httpParams);
        let httpResponseCode = httpResponse.getResponseCode();

        if ( httpResponseCode.toString().match(/2.*/) ) {
            let jsonResponse = JSON.parse(httpResponse);
            if ( jsonResponse.message === null || jsonResponse.message === undefined ) {
                Logger.log(`ResponseSuccess: Response Code=${httpResponseCode.toString()}, HTTP request success`);
            } else {
                Logger.log(`ResponseSuccess: Response Code=${httpResponseCode.toString()}, ${jsonResponse.message}`);
            };
            return httpResponse;
        } else {
            throw `ResponseError: Response Code=${httpResponseCode.toString()}, ${httpResponse.getContentText()}`;
        };
    }

    /**
     * Constructs the advanced parameters required to make an API call to Fivetran REST API.
     * @method buildHttpParams_
     * @params {string} httpMethod       - The HTTP method to use. Must be one of: `get`, `patch`, `delete`, or `post`.
     * @params {Object} [httpPayload={}] - If required, the parameter containing the payload to send to API service.
     * @returns {UrlFetchApp.HTTPResponse} The HTTP response to the API call.
     */
    buildHttpParams_(httpMethod, httpPayload={}) {
        let httpParams = {
            method: httpMethod,
            headers: this._authHeader,
            muteHttpExceptions: true,
            contentType: "application/json"
        };
        httpParams.headers["Accept"] = `application/json;version=${this.apiVersion}`;
        if ( httpMethod === "patch" || httpMethod === "post" ) {
            httpParams["payload"] = JSON.stringify(httpPayload);
        };
        return httpParams;
    }

    /**
     * Constructs the conditions string for `eval()` function in method `queryApiCursors_`.
     * @method buildFilterConditions_
     * @params {Array.<Object>} queryTexts - An Array of Objects containing the filter conditions.
     *                                       For a list of acceptable of Object keys, refer to the
     *                                       Fivetran REST API documentation.
     * @see {@link https://fivetran.com/docs/rest-api | Fivetran REST API Docs}
     * @returns {String}
     */
    buildFilterConditions_(queryTexts) {
        let filters = [];
        let doApplyFilter = false;
        let filtersString = "";
        buildFilters:
        while ( queryTexts.length > 0 ) {
            let filterQuery = queryTexts.pop();
            if ( Object.keys(filterQuery).length > 0 ) {
                doApplyFilter = true;
                let filterCondition = [];
                for ( const [key, value] of Object.entries(filterQuery) ) {
                    filterCondition.push(`item.${key} == "${value}"`);
                };
                filters.push(`(${filterCondition.join(" && ")})`);
            } else {
                continue buildFilters;
            };
        };
        filtersString = filters.join(" || ");
        return [doApplyFilter, filtersString];
    }

    /**
     * Performs a call to the API service using the `GET` HTTP method and handles pagination.
     * @method queryApiCursors_
     * @params {string}  url                      - The URL to make an API call to.
     * @params {Array.<Object>} [queryTexts=[{}]] - An Array of Objects containing the filter conditions.
     *                                              For a list of acceptable of Object keys, refer to the
     *                                              Fivetran REST API documentation.
     * @params {boolean}        [exitOnTrue=true] - An optional parameter to stop querying the HTTP
     *                                              responses once desired item has been located.
     *                                              If no argument is passed, defaults to `true`.
     * @see {@link https://fivetran.com/docs/rest-api | Fivetran REST API Docs}
     * @returns {Array} A collection of items matching filters, if any.
     */
    queryApiCursors_(url, queryTexts=[{}], exitOnTrue=true) {
        let params = this.buildHttpParams_("get");
        let queryResponse = this.makeCallToApi_(url, params);

        let responseContext = JSON.parse(queryResponse.getContentText());
        let apiCursor = responseContext.data.next_cursor;

        const [isFilterRequired, filterConditions] = this.buildFilterConditions_(queryTexts);

        let apiItems = [];

        let pageTurns = 1;
        cursorPaging:
        while ( apiCursor !== null || apiCursor !== undefined ) {
            let items = Object.values(responseContext.data.items);
            if ( filterConditions === "" ) {
                apiItems.push.apply(apiItems, items);
            } else {
                itemLoop:
                for ( let i = 0 ; i < items.length ; i++ ) {
                    let item = items[i];
                    if ( eval(filterConditions) ) {
                        apiItems.push(item);
                        if ( exitOnTrue ) {
                            break cursorPaging;
                        } else {
                            continue itemLoop;
                        };
                    };
                };
            };
            try {
                let cursorUrl = `${url}?cursor=${apiCursor}`;
                queryResponse = this.makeCallToApi_(cursorUrl, params);
                responseContext = JSON.parse(queryResponse.getContentText());
                apiCursor = responseContext.data.next_cursor;
                pageTurns += 1;
            } catch (e) {
                break cursorPaging;
            };
        };

        return apiItems;
    }

    /**
     * Returns a list of all groups within your Fivetran account.
     * @method getGroups
     * @params {Array.<Object>} [filters=[{}]]    - An optional parameter to check if return item matches
     *                                              a set of conditions (e.g., `name` is "Production").
     *                                              If no argument is passed, returns all groups in account.
     * @params {boolean}        [exitOnTrue=true] - An optional parameter to end API call once an item has
     *                                              matched any of the provided filter conditions.
     *                                              If no argument is passed, defaults to `true`.
     * @see {@link https://fivetran.com/docs/rest-api/groups#listallgroups | Fivetran REST API, Group Management}
     * @returns {Array} A collection of items matching filters, if any.
     */
    getGroups(filters=[{}], exitOnTrue=true) {
        let apiUrl = `${this.baseUrl}/groups`;
        let groups = this.queryApiCursors_(apiUrl, filters, exitOnTrue);
        return groups;
    }

    /**
     * Returns a list of all users within your Fivetran account.
     * @method getUsers
     * @params {Array.<Object>} [filters=[{}]]    - An optional parameter to check if return item matches
     *                                              a set of conditions (e.g., `email` is "test@xyz.com").
     *                                              If no argument is passed, returns all users in account.
     * @params {boolean}        [exitOnTrue=true] - An optional parameter to end API call once an item has
     *                                              matched any of the provided filter conditions.
     *                                              If no argument is passed, defaults to `true`.
     * @see {@link https://fivetran.com/docs/rest-api/users#listallusers | Fivetran REST API, User Management}
     * @returns {Array} A collection of items matching filters, if any.
     */
    getUsers(filters=[{}], exitOnTrue=true) {
        let apiUrl = `${this.baseUrl}/users`;
        let users = this.queryApiCursors_(apiUrl, filters, exitOnTrue);
        return users;
    }
}