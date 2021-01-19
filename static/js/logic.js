// Some supplementary data to populate customization fields and handle differences
// between screen names (ex: Jeopardy Round) and underlying data (ex: category[round] of 1)
const labels={"category":{"Business":["Brands","Companies"],"Culture":["Art","Awards","Dance","Events","Fashion","Food & Drink","Museums","Theatre"],"Entertainment":["Games","Internet","Magazines & Newspapers","Movies & Film","Television","The Oscars"],"Geography":["Bodies of Water","Cities","Countries","Islands","Mountains","States"],"History":["Chronology","Famous Women","Monarchies","Ships & Sailors","War"],"Language":["Languages","Letters & Letter Play","Literature","Phrases","Shakespeare","Words & Word Play"],"Music":["Classical Music","Contemporary Music"],"Nature":["Birds","Parks","Pets","Plants","Trees","Zoology"],"Politics":["Government","Law","Presidents","World Leaders"],"Religion":["God & Gods","The Church"],"Science":["Anatomy","Chemistry","Engineering","Health","Measurements","Outer Space","Teeth & Dentistry"],"Sports":["Competition","Teams"],"Other":["Colleges & Universities","Colors","Flags","Hotels","Money","Numbers & Number Play","Stamps"]},"round":{"Jeopardy Round":[200,400,600,800,1000],"Double Jeopardy Round":[400,800,1200,1600,2000],"Final Jeopardy Round":["Final Jeopardy","Tiebreaker"]},"type":{"Regular":["Regular"],"Celebrity":["Celebrity Jeopardy!","Million Dollar Celebrity Invitational","Power Players Week"],"Champions":["All-Star Games","Battle of the Decades","Jeopardy! Greatest of All Time","Million Dollar Masters","The IBM Challenge","Tournament of Champions","Ultimate Tournament of Champions"],"College":["College Championship","Kids Week Reunion"],"Kids":["Back to School Week","Holiday Kids Week","Kids Week"],"Teen":["Teen Tournament","Teen Tournament Summer Games"],"Other":["International Championship","Teachers Tournament"]}}
const roundConversion={"1":"Jeopardy Round","2":"Double Jeopardy Round","3":"Final Jeopardy Round"}
const valueConversion={"0":"Final Jeopardy","-1":"Tiebreaker"}
const defaultSettings={"hintCount":"5","questionSet":"1"}

// Booleans to check whether alerts are visible, initialized as indeterminate
// such that (alert != true) evaluates correctly on first run.
var alertWarning
var alertError

// Fetch data as csv and parse as object.
function getData(type){
    return new Promise(function(resolve, reject){
        $.ajax({
            url: `Data/${type}.csv`, 
            type: "GET",
            success: function(csvData){
                var data = $.csv.toObjects(csvData)
                resolve(data)
            },
            error: function(error){
                reject(error)
            }
        })
    })
};

// Randomly generate clue from clue object.
function generateClue(clueData){
    let keys = Object.keys(clueData)
    return clueData[keys[keys.length * Math.random() << 0]]
}

// Builds UI with a specified question set (called on start with question set 1, 
// only called again if question set is changedas it requires new data to be loaded).
function initApp(settings){
    // Before you build the UI, make sure each csv is finished being parsed as object.
    Promise.all([getData(`clue${settings["questionSet"]}`),getData(`category${settings["questionSet"]}`),getData("metadata")])
        .then(function(data){
            var clueData = data[0]
            var categoryData = data[1]
            var metadataData = data[2]
            buildClues(clueData,categoryData,metadataData,settings)
            buildCustomization(clueData,categoryData,metadataData,settings)
        })
        .catch(function(errors){
            console.log(errors)
        })
}

// Build the main page with specified clue data set, controlled by filters in the customize page.
function buildClues(clueData,categoryData,metadataData,settings){
    $("#buttonResponse").html("")
    // After randomly generating the clue, find matching category and show data.
    var clue = generateClue(clueData)
    var category = categoryData.find(row => row["categoryID"] === clue["categoryID"])
    var metadata = metadataData.find(row => row["showID"] === clue["showID"])
    // Gather and scramble near-miss hints (by default, 4 near misses + correct answer).
    var hints = []
    for (let i = 0; i < parseInt(settings["hintCount"]); i++){
        hints.push(`${clue[`answer${i+1}`]}`)
    }
    for (let i = hints.length - 1; i > 0; i--){
        let j = Math.floor(Math.random()*(i+1));
        [hints[i],hints[j]] = [hints[j],hints[i]]
    }
    $("#assignedCat").text(`${category["categoryAssigned"]}: ${category["subcategoryAssigned"]}`)
    $("#category").text(`${category["category"]}`)
    $("#clue").text(`${clue["clue"]}`)
    // Remove hints button if hint setting is set to 1.
    if (hints.length === 1){
        $("#buttons").html('<button type="button" class="btn btn-secondary mx-2 d-none" id="showHints">Show Hints</button>\
        <button type="button" class="btn btn-secondary mx-2" id="showAnswer">Show Answer</button>\
        <button type="button" class="btn btn-secondary mx-2" id="moreInfo">More Info</button>')
    } else {
        $("#buttons").html('<button type="button" class="btn btn-secondary mx-2" id="showHints">Show Hints</button>\
        <button type="button" class="btn btn-secondary mx-2" id="showAnswer">Show Answer</button>\
        <button type="button" class="btn btn-secondary mx-2" id="moreInfo">More Info</button>')
    }
    // Event handlers for hint, answer, and metadata buttons.
    // Rebuild UI with a different clue if "New Clue" button is clicked.
    $("#showAnswer").click(function(){
        $("#buttonResponse").html(`Answer:<br>${clue["answer1"]}<br>\
        <button type="button" class="btn btn-secondary mt-2" id="newClue">New Clue</button>`)
        $("#newClue").click(function(){
            buildClues(clueData,categoryData,metadataData,settings)
        })
    })
    $("#showHints").click(function(){
        $("#buttonResponse").html("The answer is one of the following:<br>")
        hints.forEach(function(hint){
            $("#buttonResponse").append(`${hint}<br>`)
        })
    })
    $("#moreInfo").click(function(){
        // Convert numeric codes Final Jeopardy clues, Tiebreakers, and Rounds.
        if (clue["value"] == "0" || clue["value"] == "-1"){
            $("#buttonResponse").html(`Value: ${valueConversion[clue["value"]]}<br>\
            Round: ${roundConversion[category["round"]]}<br>\
            Airdate: ${metadata["airdate"]}<br>
            Show Type: ${metadata["subType"]}`)
        } else {
            $("#buttonResponse").html(`Value: ${clue["value"]}<br>\
            Round: ${roundConversion[category["round"]]}<br>\
            Airdate: ${metadata["airdate"]}<br>
            Show Type: ${metadata["subType"]}`)
        }
        if (!(category["categoryComment"].length === 0)){
            $("#buttonResponse").prepend(`Category Comment: ${category["categoryComment"]}<br>`)
        }
    })
    // Update clue count on customization modal with new filtered data.
    if (Object.keys(clueData).length==1){
        $("#customizeModalLabel").text(`Customization Settings: 1 clue selected`)
    } else {
        $("#customizeModalLabel").text(`Customization Settings: ${Object.keys(clueData).length} clues selected`)
    }
}

// Build the customization modal with all possible filters, dictated by the supplementary objects at the top.
function buildCustomization(clueData,categoryData,metadataData,settings){
    // Since this function is never called with filtered clueData passed in, no length == 1 handler is needed.
    $("#customizeModalLabel").text(`Customization Settings: ${Object.keys(clueData).length} clues selected`)
    // Populate category/subcategory filters.
    $("#collapseOne").find(".card-body").html("")
    for (let [key,values] of Object.entries(labels["category"])){
        $("#collapseOne").find(".card-body").append(`<div class="btn-group-toggle text-left h5 my-2" id="${key}" data-toggle="buttons">\
        <label class="mb-0 align-top filterLabel">${key}</label>\
        <label class="btn btn-secondary active all"><input type="radio" checked><h5 class=mb-0>All</h5></label>\
        <label class="btn btn-secondary none"><input type="radio"><h5 class=mb-0>None</h5></label>\
        <label class="btn btn-secondary dropdown-toggle choose"><input type="checkbox"></label>\
        </div>`)
        values.forEach(function(value){
            $("#collapseOne").find(".card-body").append(`<div class="custom-control custom-checkbox text-left d-none">\
            <input type="checkbox" class="custom-control-input" name="${key}" value="${value}" id="${key}${value}" checked="">\
            <label class="custom-control-label" for="${key}${value}">${value}</label></div>`)
        })
    }
    // Populate round/value filters.
    $("#collapseTwo").find(".card-body").html("")
    for (let [key,values] of Object.entries(labels["round"])){
        $("#collapseTwo").find(".card-body").append(`<div class="btn-group-toggle text-left h5 my-2" id="${key}" data-toggle="buttons">\
        <label class="mb-0 align-top filterLabel">${key}</label>\
        <label class="btn btn-secondary active all"><input type="radio" checked><h5 class=mb-0>All</h5></label>\
        <label class="btn btn-secondary none"><input type="radio"><h5 class=mb-0>None</h5></label>\
        <label class="btn btn-secondary dropdown-toggle choose"><input type="checkbox"></label>\
        </div>`)
        values.forEach(function(value){
            $("#collapseTwo").find(".card-body").append(`<div class="custom-control custom-checkbox text-left d-none">\
            <input type="checkbox" class="custom-control-input" name="${key}" value="${value}" id="${key}${value}" checked="">\
            <label class="custom-control-label" for="${key}${value}">${value}</label></div>`)
        })
    }
    // Populate show type filters.
    $("#collapseThree").find(".card-body").html("")
    for (let [key,values] of Object.entries(labels["type"])){
        $("#collapseThree").find(".card-body").append(`<div class="btn-group-toggle text-left h5 my-2" id="${key}" data-toggle="buttons">\
        <label class="mb-0 align-top filterLabel">${key}</label>\
        <label class="btn btn-secondary active all"><input type="radio" checked><h5 class=mb-0>All</h5></label>\
        <label class="btn btn-secondary none"><input type="radio"><h5 class=mb-0>None</h5></label>\
        <label class="btn btn-secondary dropdown-toggle choose"><input type="checkbox"></label>\
        </div>`)
        values.forEach(function(value){
            $("#collapseThree").find(".card-body").append(`<div class="custom-control custom-checkbox text-left d-none">\
            <input type="checkbox" class="custom-control-input" name="${key}" value="${value}" id="${key}${value}" checked="">\
            <label class="custom-control-label" for="${key}${value}">${value}</label></div>`)
        })
    }
    // Populate advanced settings.
    $("#collapseFour").find(".card-body").html("")
    $("#collapseFour").find(".card-body").append(`<div class="row">\
        <div class="col-md-2 col-xs-3"><label for="hintCount"><h5 class=mb-0>Hints</h5></label></div>\
        <div class="col-md-9 col-xs-8"><input type="range" class="custom-range" name="hintCount" min="1" max="11" id="hintCount" value="${settings["hintCount"]}" oninput="hints.value=hintCount.value"></div>\
        <div class="col-md-1 col-xs-1"><h5 class=mb-0><output id="hints" name="hints" for="hintCount">${settings["hintCount"]}</output></h5></div></div>\
        <div class="btn-group-toggle text-left h5 my-2" id="questionSet" data-toggle="buttons">\
        <label class="mb-0 align-top filterLabel">Clue Set</label>\
        <label class="btn btn-secondary"><input type="radio" name="questionSet" value="1"><h5 class=mb-0>1</h5></label>\
        <label class="btn btn-secondary"><input type="radio" name="questionSet" value="2"><h5 class=mb-0>2</h5></label>\
        <label class="btn btn-secondary"><input type="radio" name="questionSet" value="3"><h5 class=mb-0>3</h5></label></div>`)
    // Converting the enter key on buttons and checkboxes to clicks to allow keyboard usage
    $(".btn").keypress(function(e){
        if (e.which === 13){
            $(this).click()
        }
    })
    $(".custom-control-input").keypress(function(e){
        if (e.which === 13){
            $(this).click()
        }
    })
    // Removing focus state from buttons, but only for mouse users.
    $(".btn").mouseout(function(){
        $(this).blur()
    })
    // There are no sub-filters for Regular show type, so remove the option.
    $("#Regular").find(".dropdown-toggle").addClass("d-none")
    // Show sub-filters on clicking dropdown button.
    $(".choose").click(function(){
        var id = $(this).parent().attr("id")
        $(`input[name="${id}"]`).each(function(){
            $(this).parent().toggleClass("d-none")
        })
    })
    // Check all sub-filter checkboxes on clicking "All" button (the reverse is also handled down below).
    $(".all").click(function(){
        var id = $(this).parent().attr("id")
        $(`input[name="${id}"]`).each(function(){
            $(this).prop("checked",true)
        })
    })
    // Uncheck all sub-filter checkboxes on clicking "None" button.
    $(".none").click(function(){
        var id = $(this).parent().attr("id")
        $(`input[name="${id}"]`).each(function(){
            $(this).prop("checked",false)
        })
    })
    // Activate "All", "None", or neither filter button depending on whether all, none, or some sub-filter checkboxes are checked.
    $(".custom-control-input").change(function(){
        var id = $(this).attr("name")
        if ($(`input[name="${id}"]:checked`).length == $(`input[name="${id}"]`).length){
            $(`div[id="${id}"`).find(".all").addClass("active")
            $(`div[id="${id}"`).find(".none").removeClass("active")
        } else if ($(`input[name="${id}"]:checked`).length == 0){
            $(`div[id="${id}"`).find(".all").removeClass("active")
            $(`div[id="${id}"`).find(".none").addClass("active")            
        } else {
            $(`div[id="${id}"`).find(".all").removeClass("active")
            $(`div[id="${id}"`).find(".none").removeClass("active")
        }
    })
    // Clean up the customization modal on smaller screens.
    if ($(window).width() < 400){
        $(".filterLabel").each(function(){
            $(this).after("<br>")
        })
    }
    // Activate clue set button manually, as there is a handler below to display a warning on change.
    $("#questionSet").find(`input[value="${settings["questionSet"]}"]`).click()
    $("input[type=radio][name=questionSet]").change(function(){
        if (this.value != "1"){
            if (alertWarning != true){
                $(".modal-body").prepend('<div class="alert alert-warning alert-dismissible">\
                <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\
                <strong>Warning:</strong> Clue sets 2 and 3 have less reliable categorization and will require new files to be loaded.\
                </div>')
                alertWarning = true
                $(".alert-warning").on("close.bs.alert", function(){
                    alertWarning = false
                })
            }
        }
    })
    // Upon clicking the "Save Changes" button, combine all clue, category, and metadata filters
    // to produce a final filtered clueData object to pass to buildClues.
    $("#customizeSave").off().click(function(){
        // Create object out of customization form results.
        var formData = $("form").serializeArray()
        // Find which form entries will be used to filter clues, categories, metadata, and settings.
        var categoryAssignedFilter = formData.filter(function(row){
            return Object.keys(labels["category"]).includes(row["name"])
        })
        var roundValueFilter = formData.filter(function(row){
            return Object.keys(labels["round"]).includes(row["name"])
        })
        var showTypeFilter = formData.filter(function(row){
            return Object.keys(labels["type"]).includes(row["name"])
        })
        // Filter categories by matching category and subcategory.
        var categoryDataFiltered1 = categoryData.filter(function(category){
            for (let i = 0; i < categoryAssignedFilter.length; i++){
                let row = categoryAssignedFilter[i]
                if (category["categoryAssigned"] === row["name"] && category["subcategoryAssigned"] === row["value"]){
                    return true
                }
            }
            return false
        })
        // Filter categories by matching round.
        var categoryDataFiltered2 = categoryDataFiltered1.filter(function(category){
            for (let i = 0; i < roundValueFilter.length; i++){
                let row = roundValueFilter[i]
                if (roundConversion[category["round"]] === row["name"]){
                    return true
                }
            }
            return false
        })
        // Filter clues by matching value.
        var clueDataFiltered1 = clueData.filter(function(clue){
            for (let i = 0; i < roundValueFilter.length; i++){
                let row = roundValueFilter[i]
                if (row["value"] == "Final Jeopardy" || row["value"] == "Tiebreaker"){
                    if (valueConversion[clue["value"]] === row["value"]){
                        return true
                    }
                } else {
                    if (clue["value"] === row["value"]){
                        return true
                    }
                }
            }
            return false
        })
        // Filter metadata by matching show type.
        var metadataDataFiltered = metadataData.filter(function(show){
            for (let i = 0; i < showTypeFilter.length; i++){
                let row = showTypeFilter[i]
                if (show["type"] === row["name"] && show["subType"] === row["value"]){
                    return true
                }
            }
            return false
        })
        // Find which clues satisfy the category and show filters. Converting to a set
        // turned out much faster than using the includes() method.
        var showIDs = new Set(metadataDataFiltered.map(row => row["showID"]))
        var clueDataFiltered2 = clueDataFiltered1.filter(function(clue){
            return showIDs.has(clue["showID"]) 
        })
        var categoryIDs = new Set(categoryDataFiltered2.map(row => row["categoryID"]))
        var clueDataFilteredFinal = clueDataFiltered2.filter(function(clue){
            return categoryIDs.has(clue["categoryID"])
        })
        // Prevent buildClues from being called if the filter returns no results.
        if (clueDataFilteredFinal.length == 0){
            $("#customizeModalLabel").text(`Customization Settings: 0 clues selected`)
            if (alertError != true){
                $(".modal-body").prepend('<div class="alert alert-danger alert-dismissible">\
                <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\
                <strong>Error:</strong> Filtering returns no clues.\
                </div>')
                alertError = true
                $(".alert-danger").on("close.bs.alert", function(){
                    alertError = false
                }) 
            }
        // Call initApp, loading new data if the clue set is changed.
        } else if (formData.find(element => element["name"] == "questionSet")["value"] != settings["questionSet"]){
            var newSettings = {}
            newSettings["hintCount"] = formData.find(element => element["name"] == "hintCount")["value"]
            newSettings["questionSet"] = formData.find(element => element["name"] == "questionSet")["value"]
            initApp(newSettings)
        // Call buildClues with new hint count if hint count is changed.
        } else if (formData.find(element => element["name"] == "hintCount")["value"] != settings["hintCount"]){
            var newSettings = {}
            newSettings["hintCount"] = formData.find(element => element["name"] == "hintCount")["value"]
            newSettings["questionSet"] = settings["questionSet"]
            buildClues(clueDataFilteredFinal,categoryData,metadataData,newSettings)
        // Otherwise, call buildClues with the newly filtered clue data.
        } else {
            buildClues(clueDataFilteredFinal,categoryData,metadataData,settings)
        }
    })
    // On reset, only customization settings need to be changed if clue set is 1.
    // If it isn't, clue set 1 needs to be reloaded and thus initApp needs to be called.
    $("#customizeReset").off().click(function(){
        if (settings["questionSet"] != "1"){    
            initApp(defaultSettings)
        } else {
            buildCustomization(clueData,categoryData,metadataData,defaultSettings)
        }
    })
}

// Initialize everything with clue set 1 on page load.
initApp(defaultSettings);