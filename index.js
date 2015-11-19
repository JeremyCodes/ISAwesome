/***************************************************************************
   Copyright 2015 OSIsoft, LLC.
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 ***************************************************************************/
/********************************************************
 getAjax
 Helper function for handling CORS API requests with 
 kerberos authentication via Ajax.

 NOTE: To successfully use CORS for API requests you 
 need to set up the following in PI System Explorer.
 // //OSIsoft/PI WebAPI/YourPIWebAPIHost/SystemConfiguration
 and set CorsSupportsCredentials = true and
 set your Cors settings as appropriate.

 In addition this needs to be run from a web server for
 CORS to work properly. This was originally written as 
 an ASP .NET Website and security was set up there.
********************************************************/
var getAjax = function (url, method, callback) {
    $.ajax({
        url: encodeURI(url),
        method: method,
        success: callback,
        error: function (xhr) {
            console.log(xhr.responseText);
        },
        xhrFields: {
            withCredentials: true
        }
    });
}


// Populates the dropdown menus with available sources on ready
function populateDropdown() {
    var sources_url = "https://localhost/piwebapi/search/sources";

    getAjax(sources_url, "GET", function (obj) {
        try {
            // on ASync response, populate the dropdown with returned sources.
            for (index in obj.Items) {
                    var name = obj.Items[index].Name
                    $('ul').append('<li><a href="#" data-name="' + name + '">' + name + '</a></li>');
            }

            // On click, update button to selected source and signal a source change.
            $('a').on('click', function () {
                $(".btn:first-child").text($(this).text());
                sourceChanged($(this).text());
            });
        }
        catch (e) {
            console.log("Exception caught: " + e);
        }

    });
}


// On source change, resend the query to populate the table.
function sourceChanged(source) {
    var query_url = "https://localhost/piwebapi/search/query?q=gas" + "&scope=" + source;

    indexedSearchQuery(query_url);
}


// Used to reduce duplication.
// Calls the Ajax helper function with the passed query
// and updates the Webpage with the given results.
// Errors are logged to console.
function indexedSearchQuery(query) {
    if (query != "") {
        getAjax(query, "GET", function (obj) {
            try {
                // On response, update and log.
                displayTable(obj);
                updateButtons(obj);
                logErrors(obj.Errors);
            }
            catch (e) {
                Console.log("Exception caught in indexedSearchQuery: " + e);
            }
        });
    }
    else {
        console.log("Error: No query supplied to indexedSearchQuery.");
    }
}


// Used to wipe stale date from webpage.
function initializeTable() {
    $('#table-results tbody').remove()
};


// Called on response with 
function displayTable(data) {
    // Reset Table
    initializeTable();

    // Rebuild Table
    $('#table-results').append("<tbody>");

    for (index in data.Items) {
        var my_table = "<tr>" +
            "<td>" + data.Items[index].Name + "</td>" +
            "<td>" + data.Items[index].Description + "</td>" +
            "<td>" + data.Items[index].Score + "</td>" +
            "</tr>";
        $('#table-results tbody').append(my_table);
    }
    $('#table-results').append("</tbody>");
}


// Unbinds the click event on buttons and sets it to an updated json_obj
// based on last query.
function updateButtons(json_obj) {
    $(".btn-default").unbind("click");
    $(".btn-default").click(function () {
        buttonClicked($(this)[0].defaultValue, json_obj);
        return false;
    });
}


// Logs Errors in error_array to console.
function logErrors(error_array) {
    for (index in error_array) {
        console.log("Error #: " + error_array[index].ErrorCode);
        console.log("- Source: " + error_array[index].Source);
        console.log("- Message: " + error_array[index].Message);
    }
}


// Shim to implement previous page functionality.
function linkPrevious(next_link) {
    var previous_link = "";
    var next_page = 0;

    // grab the next page start index
    var start_index = next_link.substring((next_link.search(/&start=*/)), (next_link.length));
    previous_link = next_link.substring(0, (next_link.search(/&start=*/)));
    start_index = start_index.substring((start_index.search(/=/) + 1), start_index.length);

    // previous page is (next_link.start - (2 * count)). One step forward, 2 steps back.
    var start_field = Number(start_index) - (2 * (10));

    // If the start field is greater than 0, then there is a previous page, 
    //otherwise leave alone as a link to first page.
    if (start_field >= 10) {
        previous_link += "&start=" + start_field;
    }

    return previous_link;
}


// On button click, see which button was pressed and perform the appropriate action.
function buttonClicked(button_type, previous_query){
    var query_url = "";

    switch (button_type) {
        case "Next":
            query_url = previous_query.Links.Next;
            break;
        case "Previous":
            query_url = linkPrevious(previous_query.Links.Next);
            break;
        case "First":
            query_url = previous_query.Links.First;
            break;
        case "Last":
            query_url = previous_query.Links.Last;
            break;
    }

    //replace on the supplied link to clean up the url
    query_url = decodeURIComponent(query_url);
    indexedSearchQuery(query_url);
}


// Main starting point of the code.
$(document).ready(function () {
    populateDropdown();     // get sources
    initializeTable();      // make sure table is cleared for initial dispaly
});
