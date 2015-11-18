// Ajax request with kerberos authentication
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

function populateDropdown() {
    var sources_url = "https://localhost/piwebapi/search/sources";

    getAjax(sources_url, "GET", function (obj) {
        console.log(obj);
        console.log(obj.Items);
        try {
            for (index in obj.Items) {
                    var name = obj.Items[index].Name
                    console.log(name);
                    $('ul').append('<li><a href="#" data-name="' + name + '">' + name + '</a></li>');
            }

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


function sourceChanged(source) {
    var query_url = "https://localhost/piwebapi/search/query?q=gas" + "&scope=" + source;

    getAjax(query_url, "GET", function (obj) {
        console.log(obj);
        console.log(obj.Items);
        console.log(obj.Items[0].Name);
        try {
            displayTable(obj, undefined);
            $(".btn-default").unbind("click");
            $(".btn-default").click( function () {
                buttonClicked($(this)[0].defaultValue, obj);
            });
        }
        catch (e) {
        }
    });
}


function buttonClicked(button_type, previous_query){
    console.log(button_type + " " + previous_query);

    var query_url = "";

    switch (button_type) {
        case "Next":
            query_url = previous_query.Links.Next;
            break;
        case "Previous":
            break;
        case "First":
            query_url = previous_query.Links.First;
            break;
        case "Last":
            query_url = previous_query.Links.Last;
            break;
    }

    console.log(query_url);
    query_url = (query_url.replace(/%3A/g, ":")).replace(/%5C/g, "\\");
    console.log(query_url);

    if (query_url != "") {
        getAjax(query_url, "GET", function (obj) {
            console.log(obj);
            try {
                displayTable(obj, undefined);

                //reset buttons to new query.
                $(".btn-default").unbind("click");
                $(".btn-default").click(function () {
                    buttonClicked($(this)[0].defaultValue, obj);
                    return false;
                });
            }
            catch (e) {
            }
        });
    }
}


function initializeTable() {
    $('#table-results tbody').remove()
};


function displayTable(data, page) {
    // Reset Table
    initializeTable();

    // Rebuild Table
    $('#table-results').append("<tbody>");

    for (index in data.Items) {
        var my_table = "<tr>" +
            "<td>" + data.Items[index].Name + "</td>" + 
            "<td>" + data.Items[index].Description + "</td>" +
            "<td>" + data.Items[index].Score + "</td>" + 
            "<td>" + "TBD" + "</td>" +
            "</tr>";
        $('#table-results tbody').append(my_table);   
    }
    $('#table-results').append("</tbody>");
}

$(document).ready(function () {
    populateDropdown();     // get sources
    initializeTable();      // make sure table is cleared for initial dispaly
});
