
/**
  * @desc vehicleSelection constructor
  * @param {object} pobj
    * @key {object} FG, FairGarage API library
    * @key {object} OF, Offer object
    * @key {string} model, DOM selector, on which the model is used
    * @key {number} foundVehicleLimit, max number of found vehicle
*/

var vehicleSelection = function(pobj){
    var self = this;
    var FG = pobj.FG;
    if (typeof FG === 'undefined') {
        return console.error('FairGarage is not defined');
    }
    var OF = pobj.OF;
    if (typeof OF === 'undefined') {
        return console.error('offer is not defined');
    }
    var model = pobj.model;
    if (typeof model === 'undefined') {
        return console.error('model is not defined');
    } else {
        model = $(model);
    }

    var compareWhenAllVehiclesFound = pobj.compareWhenAllVehiclesFound;
    var maxGetVehiclesByCategory = pobj.maxGetVehiclesByCategory;
    var numberOfMaxValidVehicles = pobj.numberOfMaxValidVehicles;

    var selector = {
        select: {
            allInVehicle: 'select',
            FZA: '.selectFZA select',
            Brand: '.selectBrand select',
            Year: '.selectCTYear select',
            Month: '.selectCTMonth select',
            Series: '.selectSeries select'
        },
        error: {
            noVehiclesForService: '.noVehiclesForService',
            noVehiclesForCategory: '.noVehiclesForCategory'
        },
        mask: '.mask'
    };

    var properties = {
        year: '',
        month: ''
    };

    var vehicleProgressBarName = 'vehicleSelection';
    var vehicleModelProgressBarName = 'vehicleModelSelection';
    var vehicleMotorProgressBarName = 'vehicleMotorSelection';

    /**
      * @desc initialize counters
    */
    function initVehicleCounter(){
        properties.foundVehicles = [];
        properties.goodVehicleTypes = [];
        properties.numberOfVehicles = 0;
        properties.numberOfNoServiceVehicles = 0;
        properties.numberOfModelsRemaining = 0;
        properties.numberOfMotorsRemaining = 0;
        properties.numberOfCheckedVehicles = 0;
        properties.countMotorsFinished = false;
        properties.vehicleCountTriggered = false;
        properties.hasError = false;
        properties.numberOfRunningGetVehiclesByCategory= 0;
        properties.maxGetVehiclesByCategory = maxGetVehiclesByCategory || 1000;
        properties.foundVehicleLimit = typeof pobj.foundVehicleLimit === 'undefined' ? null : pobj.foundVehicleLimit;
    }

    /**
      * @desc show error message by giving the corresponding jQuery element
    */
    function showError(jQElement){
        hideError();
        jQElement.show();
        PB.reset();
        hideProgressBar();
        properties.hasError = true;
        enableSomeSelection($(selector.select.Series));
        OF.hideMask();
    }

    /**
      * @desc hide error messages
    */
    function hideError(){
        $('.error', model).hide();
    }

    /**
      * @desc show mask
    */
    function showMask(){
        $(selector.mask, model).show();
    }

    /**
      * @desc show mask
    */
    function hideMask(){
        $(selector.mask, model).hide();
    }

    /**
      * @desc disable vehicle selection
    */
    function disableSelection(){
        $(selector.select.allInVehicle, model).prop('disabled',true);
        showMask();
    }

    /**
      * @desc disable vehicle selection
    */
    self.enableAllSelection = function(){
        $(selector.select.allInVehicle, model).prop('disabled',false);
        hideMask();
    };

    /**
      * @desc enable some vehicle selection
      * @param {object} jQSelect, jQuery element of the select
    */
    function enableSomeSelection(jQSelect){
        var selectOrder = [$(selector.select.FZA, model), $(selector.select.Brand, model), $(selector.select.Year, model), $(selector.select.Month, model), $(selector.select.Series, model)];
        var length = selectOrder.length;
        var index = -1;
        var found = false;
        for (var i = length - 1; i >= 0; i --){
            if (jQSelect.get(0) === selectOrder[i].get(0)) {
                found = true;
            }
            if (found) {
                selectOrder[i].prop('disabled',false);
            } else {
                selectOrder[i].prop('disabled',true);
            }
        }
        hideMask();
    }

    /**
      * @desc append options in the vehicle selection
      * @param {array} data, array of option objects. The structure of the option object:
          * @key {number} id, vehicle category ID
          * @key {string} name, category name
      * @param {object} jQSelect, the jQuery object of the select element to append the options, values are related with enableSomeSelection()
    */
    function appendOptions(data,jQSelect){
        jQSelect.children().not(':first').remove();
        $.each(data,function(){
            jQSelect.append('<option value="' + this.id + '">' + this.name + '</option>');
            jQSelect.find('option:last').data('data',this);
        });
        enableSomeSelection(jQSelect);
    }

    /**
      * @desc store the selected data to the select element
      * @param {DOM element} element, the select DOM element
    */
    function storeDataToSelect(element){
        $(element).data('data',$(element).find('option:eq(' + $(element).prop('selectedIndex') + ')').data('data'));
    }

    /**
      * @desc get FZA from FairGarage API
    */
    function getFZA(){
        disableSelection();
        FG.findVehicleByCatalog({
            vehicleCategoryId: 0,
            ajax: {
                success: function(data){
                    appendOptions(data.categories,$(selector.select.FZA, model));
                }
            }
        });
    }
    // bind the function to the ready event of document
    $(document).ready(function(){
        getFZA();
    });

    /**
      * @desc get Brand from FairGarage API
      * @param {string or integer} categoryId, ID of the category
    */
    function getBrand(categoryId){
        FG.findVehicleByCatalog({
            vehicleCategoryId: categoryId,
            ajax: {
                success: function(data){
                    appendOptions(data.categories,$(selector.select.Brand, model));
                }
            }
        });
    }
    // bind the function to the change event of FZA select
    $(selector.select.FZA, model).bind('change',function(){
        var value = $(this).val();
        if (value >= 0) {
            hideError();
            disableSelection();
            storeDataToSelect(this);
            getBrand(value);
        }
    });

    /**
      * @desc set construction time from selected brand
      * @param {object} constructionTimeMap, the construction time map object from FairGarage API
    */
    function setCT(constructionTimeMap){
        getYear(constructionTimeMap);
    }
    // bind the function to the change event of brand select
    $(selector.select.Brand, model).bind('change',function(){
        var value = $(this).val();
        if (value >= 0) {
            hideError();
            disableSelection();
            storeDataToSelect(this);
            properties.brand = value;
            setCT($(this).data('data').constructionTimeMap);
        } else {
            enableSomeSelection($(this));
        }
    });

    /**
      * @desc change an array of numbered months (from 1 to 12) to an array of adapted objects to better append on select elements
      * @param {array} months
    */
    function monthToOptionStructure(months){
        var translations = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
        var output = [];
        $.each(months.sort(function(a,b){return a-b;}),function(){
            if (this > 0) {
                output.push({
                    id: this,
                    name: translations[this-1]
                });
            }
        });
        return output;
    }

    /**
      * @desc set year of construction time from selected brand
      * @param {object} constructionTimeMap, the construction time map object from FairGarage API
    */
    function getYear(constructionTimeMap){
        var years = [];
        var currentYear = (new Date()).getFullYear();
        var currentMonth = (new Date()).getMonth();
        var monthsOfCurrentYear = [];
        for (var i = 0; i <= currentMonth; i++) {
            monthsOfCurrentYear.push(i+1);
        }
        for (var year in constructionTimeMap) {
            if (year <= currentYear) {
                years.push(year);
            }
        }
        var data = [];
        $.each(years.sort(function(a,b){return b-a;}),function(){
            var months = [];
            var year = this.toString();
            if (year === currentYear.toString()) {
                months = monthsOfCurrentYear;
            } else {
                months = constructionTimeMap[year];
            }
            data.push({
                id: year,
                name: year,
                months: monthToOptionStructure(months)
            });
        });
        appendOptions(data,$(selector.select.Year, model));
    }

    /**
      * @desc set month of construction time from selected brand
    */
    function getMonth(){
        appendOptions($(selector.select.Year, model).data('data').months,$(selector.select.Month, model));
    }
    // bind the function to the change event of year select
    $(selector.select.Year, model).bind('change',function(){
        var value = $(this).val();
        if (value >= 0) {
            hideError();
            disableSelection();
            storeDataToSelect(this);
            properties.year = value;
            properties.constructionTime = Date.UTC(properties.year, properties.month - 1);
            getMonth();
        } else {
            enableSomeSelection($(this));
        }
    });

    /**
      * @desc get series of construction time from selected brand
    */
    function getSeries(){
        FG.findVehicleByCatalog({
            vehicleCategoryId: properties.brand,
            criteria: {
                constructionTime: properties.constructionTime
            },
            ajax: {
                success: function(data){
                    appendOptions(data.categories,$(selector.select.Series, model));
                }
            }
        });
    }
    // bind the function to the change event of month select
    $(selector.select.Month, model).bind('change',function(){
        var value = $(this).val();
        if (value >= 0) {
            hideError();
            disableSelection();
            storeDataToSelect(this);
            properties.month = value;
            properties.constructionTime = Date.UTC(properties.year, properties.month - 1);
            getSeries();
        } else {
            enableSomeSelection($(this));
        }
    });

    /**
      * @desc triggers when vehicle count is finished
    */
    function triggerVehicleCountFinished(){
        properties.vehicleCountTriggered = true;
        if (properties.hasError === false && !compareWhenAllVehiclesFound) {
            OF.displayVehicles(properties.foundVehicles);
        }
        console.log('vehicle count finished');
    }

    /**
      * @desc triggers when counting of vehicles having the service is finished
    */
    function triggerValidVehicleCountFinished(){
        console.log('valid vehicle count finished');
        var numberOfOfferSearches = properties.numberOfVehicles - properties.numberOfNoServiceVehicles;
        OF.setNumberOfOfferSearches(numberOfOfferSearches);
        PB.complete(vehicleProgressBarName);
        hideMask();
        if (compareWhenAllVehiclesFound) {
            var temp = properties.goodVehicleTypes;
            var numberOfGoodVehicleTypes = temp.length;
            var goodVehicleTypes = [];
            if (numberOfGoodVehicleTypes > numberOfMaxValidVehicles) {
                var step = temp.length / numberOfMaxValidVehicles; // step size is always > 1
                for (var i = 0; i < numberOfMaxValidVehicles; i ++){
                    goodVehicleTypes.push(temp[Math.floor(step * i)]);
                }
            } else {
                goodVehicleTypes = temp;
            }
            OF.setNumberOfOfferSearches(goodVehicleTypes.length);
            OF.displayVehicles(goodVehicleTypes);

            $.each(goodVehicleTypes,function(i,vehicleType){
                OF.addVehicle({
                    vehicleType: vehicleType,
                    constructionTime: properties.constructionTime
                });
                OF.createUserSearch({
                    vehicleType: vehicleType,
                    constructionTime: properties.constructionTime
                });
            });
        }
    }

    /**
      * @desc get all vehicles from a category ID
    */
    function getVehiclesFromCategory(){
        PB.reset()
        .createNewProgress({
            name: vehicleModelProgressBarName,
            weight: 10
        })
        .createNewProgress({
            name: vehicleMotorProgressBarName,
            weight: 10
        })
        .createNewProgress({
            name: vehicleProgressBarName,
            weight: 50,
            initStepSize: 5
        });

        OF.init();
        initVehicleCounter();

        showProgressBar();

        getVehiclesByCategory(properties.series,'model');
    }
    /**
      * @desc get vehicles from a category by recursion
      * @param {number or string} id, category ID of the vehicle
      * @param {string} categoryName, next category name of the vehicle, accepted are 'model', 'motor' and 'body'
    */
    function getVehiclesByCategory(id,categoryName){
        if (continueSearchingForVehicles()) {
            if (properties.numberOfRunningGetVehiclesByCategory >= properties.maxGetVehiclesByCategory) {
                setTimeout(function(){
                    getVehiclesByCategory(id,categoryName);
                },1000);
            } else {
                properties.numberOfRunningGetVehiclesByCategory ++;
                FG.findVehicleByCatalog({
                    vehicleCategoryId: id,
                    criteria: {
                        constructionTime: properties.constructionTime
                    },
                    ajax: {
                        success: function(data){
                            if (data.categories.length > 0) {// not the last vehicle category level
                                switch (categoryName) {
                                    case 'model':
                                        // this is called only once
                                        properties.numberOfModelsRemaining = data.categories.length;
                                        $.each(data.categories,function(){
                                            getVehiclesByCategory(this.id,'motor');
                                        });
                                        PB.complete(vehicleModelProgressBarName);
                                        break;
                                    case 'motor':
                                        properties.numberOfMotorsRemaining += data.categories.length;
                                        if (properties.numberOfModelsRemaining > 0) {
                                            properties.numberOfModelsRemaining--;
                                            PB.increment(vehicleMotorProgressBarName);
                                            if (properties.numberOfModelsRemaining === 0) {
                                                properties.countMotorsFinished = true;
                                                PB.complete(vehicleMotorProgressBarName);
                                            }
                                        }
                                        $.each(data.categories,function(){
                                            getVehiclesByCategory(this.id,'body');
                                        });
                                        break;
                                    default:
                                        break;
                                }
                            } else {
                                if (data.types.length > 0) {// is the last vehicle category level
                                    var newData = setVehicleName(data).types;
                                    var validData = [];
                                    $.each(newData,function(i){
                                        if (continueSearchingForVehicles() === true) {
                                            properties.foundVehicles.push({
                                                id: this.id,
                                                name: this.name
                                            });
                                            validData.push(newData[i]);
                                        }
                                    });
                                    properties.numberOfVehicles += validData.length;
                                    properties.numberOfMotorsRemaining--;
                                    if (
                                    (properties.countMotorsFinished === true && properties.numberOfMotorsRemaining === 0) ||
                                    (continueSearchingForVehicles() === false && properties.vehicleCountTriggered === false)) {
                                        triggerVehicleCountFinished();
                                    }
                                    checkServiceAvailability(validData);
                                } else {// no further categories found for this category
                                    showError($(selector.error.noVehiclesForCategory, model));
                                }
                            }
                        },
                        complete: function(){
                            properties.numberOfRunningGetVehiclesByCategory--;
                        }
                    }
                });
            }
        }
    }
    /**
      * @desc continue searching for vehicles
      * @return {boolean} cont
    */
    function continueSearchingForVehicles(){
        var cont = true;
        if (properties.foundVehicleLimit > 0 && properties.foundVehicles.length >= properties.foundVehicleLimit) {
            cont = false;
        }
        return cont;
    }
    /**
      * @desc check whether the service is available for the vehicle
      * @param {array} types, FairGarage vehicle types, array of objects
    */
    function checkServiceAvailability(types){
        var searchCriteriaNotComplete = false;
        var searchCriteriaErrorMessage = [];
        if (typeof FG.properties.region === 'undefined') {
            searchCriteriaNotComplete = true;
            searchCriteriaErrorMessage.push('Region is missing');
        }
        if (typeof FG.properties.service === 'undefined') {
            searchCriteriaNotComplete = true;
            searchCriteriaErrorMessage.push('Service is missing');
        }
        if (searchCriteriaNotComplete) {
            console.error('Search criteria not complete: ' + searchCriteriaErrorMessage.join('; '));
        } else {
            $.each(types,function(i,vehicleType){
                var errorShown = false;

                FG.getServiceById({
                    serviceId: FG.properties.service.id,
                    criteria: {
                        constructionTime: properties.constructionTime,
                        vehicleTypeId: this.id
                    },
                    ajax: {
                        success: function(data){// service available for this vehicle, create offer searches
                            if (compareWhenAllVehiclesFound) {
                                properties.goodVehicleTypes.push(vehicleType);
                            } else {
                                OF.addVehicle({
                                    vehicleType: vehicleType,
                                    constructionTime: properties.constructionTime
                                });
                                OF.createUserSearch({
                                    vehicleType: vehicleType,
                                    constructionTime: properties.constructionTime
                                });
                            }
                        },
                        error: function(){// overwrite default error function
                            properties.numberOfNoServiceVehicles++;
                            if (properties.numberOfNoServiceVehicles === properties.numberOfVehicles && properties.vehicleCountTriggered === true) {
                                showError($(selector.error.noVehiclesForService, model));
                                errorShown = true;
                            }
                        },
                        complete: function(){
                            if (errorShown === false) {
                                properties.numberOfCheckedVehicles++;
                                PB.increment(vehicleProgressBarName);
                                if (properties.numberOfCheckedVehicles === properties.numberOfVehicles && properties.vehicleCountTriggered === true) {
                                    triggerValidVehicleCountFinished();
                                }
                            }
                        }
                    }
                });
            });
        }
    }
    /**
      * @desc formulate vehicle name such that they are unique
      * @param {object} data, object of last category of vehicle selection
    */
    function setVehicleName(data) {
        var fahrzeugtypKeys = ["DAT_AVALB", "DAT_AVKAB", "DAT_AVGEB", "DAT_AVANB", "DAT_AVRAB", "DAT_ANTRB", "DAT_KW", "DAT_CCM", "DAT_AZYL"]; // keys in a related order to identify the vehicle
        var output = data;
        var html = [];
        var optionCount = 0; // count of options
        var propertyCountOneOption = 0; // used if only one option is available to avoid long text of properties, after 2 properties (propertyCountOneOption == 2) we stop

        // add the opening option tag + value
        $.each(data.types, function(i, item) {
            if(item.visible) {
                html.push([]);
                optionCount++;
            }
        });

        // add all porperties as text
        $.each(fahrzeugtypKeys, function(i, propertyKey) {
            var hasSameProperty = true;
            var propertyCount = 0; // counts how often the related property is found in all types
            var text = "";
            var htmlIndex = 0;

            $.each(data.types, function(j, item) {
                if(item.visible) {
                    // iterate through property list of the entry
                    $.each(item.properties, function(k, property) {
                        // if property key is the same of our list
                        if(property.key == propertyKey) {
                            if (typeof String.prototype.trim !== 'function') {
                                String.prototype.trim = function() {
                                    return this.replace(/^\s+|\s+$/g, '');
                                };
                            }
                            var value = property.value.trim();

                            html[htmlIndex].push(value);

                            if (text === "") {
                                // save the first value text
                                text = value;
                            } else {
                                // if this entry has another value, set same property to false
                                if(text != value) {
                                    hasSameProperty = false;
                                }
                            }

                            propertyCount++;
                            propertyCountOneOption++;
                        }
                    });

                    htmlIndex++;
                }
            });

            // if we have for all options the same property value, remove it
            // BUT: if we only found 1 entry with this property, it's not true if "hasSameProperty" (default value) is set to true,
            // because there was no possibility to set it to false
            // so make sure that we really have at least 2 types found with this property to compare
            if(propertyCount > 1 && hasSameProperty) {
                $.each(html, function(m) {
                    html[m].pop();
                });
            }

            // if we have only one option, we only show maximal 3 properties to avoid long text
            if(optionCount == 1 && propertyCountOneOption == 2) {
                return false;
            }
        });

        // put all together to an option field
        var dataTypeIndex = 0;
        $.each(data.types, function(i, item) {
            var text = html[dataTypeIndex].join(', ');

            if(item.visible) {
                //html[dataTypeIndex] = []; // reset
                //html[dataTypeIndex].push('<option value="' + item.id + '">' + text + '</option>');
                output.types[dataTypeIndex].name += text;
                dataTypeIndex++;
            }
        });

        return output;
    }
    // bind the function to the change event of month select
    $(selector.select.Series, model).bind('change',function(){
        var value = $(this).val();
        if (value >= 0) {
            hideError();
            disableSelection();
            storeDataToSelect(this);
            properties.series = value;
            getVehiclesFromCategory();
        } else {
            enableSomeSelection($(this));
        }
    });

    self.getProperties = function(){
        return properties;
    };

};
