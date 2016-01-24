
/**
  * @desc offers constructor
  * @param {object} pobj
    * @key {object} FG, FairGarage API library
    * @key {string} model, DOM selector, on which the model is used
    * @key {number} maxPostOfferSearches, max number of parellel running POST offer searches
    * @key {number} offerPerVehicle, number of offers per vehicle
*/

var offers = function(pobj){
    var FG = pobj.FG;
    if (typeof FG === 'undefined') {
        return console.log('FairGarage is not defined');
    }
    var model = pobj.model;
    if (typeof model === 'undefined') {
        return console.error('model is not defined');
    } else {
        model = $(model);
    }
    var maxPostOfferSearches = pobj.maxPostOfferSearches;
    if (typeof maxPostOfferSearches === 'undefined') {
        maxPostOfferSearches = 5;
    }
    var offerPerVehicle = pobj.offerPerVehicle;
    if (typeof offerPerVehicle === 'undefined') {
        offerPerVehicle = null;
    }

    var self = {};

    var properties = {
        offerPerVehicle: offerPerVehicle,
        maxPostOfferSearches: maxPostOfferSearches
    };

    var selector = {
        template: {
            offer: '.template > *'
        },
        row: {
            visibleOffers: '> .offerSingle'
        },
        mask: '.mask',
        error: '.error'
    };

    var progressBarName = 'offer';

    model.hide();

    /**
      * @desc show mask
    */
    self.showMask = function(){
        $(selector.mask, model).show();
    };

    /**
      * @desc show mask
    */
    self.hideMask = function(){
        $(selector.mask, model).hide();
    };

    /**
      * @desc initialize variables of offers object
    */
    self.init = function(){
        model.hide();
        $(selector.error, model).hide();
        $(selector.row.visibleOffers, model).remove();
        var newProperties = {
            numberOfOfferSearches: 0,
            numberOfOfferSearchesFinished: 0,
            numberOfRunningPostOfferSearches: 0,
            vehicleOffers: {},
            isFirstOffer: true
        };
        properties = $.extend(properties,newProperties);
        if (typeof FG.properties.service !== 'undefined') {
            properties.service = FG.properties.service;
        }
        if (typeof FG.properties.region !== 'undefined') {
            properties.region = FG.properties.region;
        }

        PB.createNewProgress({
            name: progressBarName,
            weight: Math.floor(Math.random() * 20) + 100,
            initStepSize: 5
        });
    };

    /**
      * @desc add vehicle to vehicleOffers in properties
      * @param {object} vehicleType, FairGarage vehicleType object
    */
    self.addVehicle = function(obj){
        var vehicleTypeId = obj.vehicleType.id.toString();
        properties.vehicleOffers[vehicleTypeId] = {
            vehicleName: obj.vehicleType.name,
            constructionTime: obj.constructionTime
        };
        self.createUserSearch(obj);
    };

    /**
      * @desc set the number of offer searches to perform (for the selected service)
      * @param {number} number
    */
    self.setNumberOfOfferSearches = function(number){
        properties.numberOfOfferSearches = number;
        PB.incrementLinearly({
            name: progressBarName,
            maxScore: number
        });
    };

    /**
      * @desc set the location object
      * @param {object} location, TODO
    */
    self.setLocation = function(location){
        properties.location = location;
    };

    /**
      * @desc create offer searches for the vehicle
      * @param {object} selectedVehicle, FairGarage selectedVehicle object
      * @param {number or string} locationId, ID of the location
    */
    self.createUserSearch = function(selectedVehicle,locationId){
        FG.createUserSearch({
            userSearchData: {
                selectedVehicle: selectedVehicle,
                selectedServiceList: [{
                    service: {
                        id: FG.properties.service.id
                    }
                }]
            },
            ajax: {
                success: function(data){
                    var userSearchConfigKey = data.key;
                    var vehicleTypeId = selectedVehicle.vehicleType.id.toString();
                    self.createOfferSearch(userSearchConfigKey,vehicleTypeId,locationId);
                },
                error: function(){
                    $(selector.mask, model).hide();
                    $(selector.error, model).show();
                },
                complete: function(){
                    properties.numberOfRunningPostOfferSearches --;
                }
            }
        });
    };

    /**
      * @desc create offer searches for the vehicle
      * @param {string} userSearchConfigKey, FairGarage user search key
      * @param {number or string} locationId, ID of the location
    */
    self.createOfferSearch = function(userSearchConfigKey,vehicleTypeId,locationId){
        // searching offers for the location should be performed immediately
        if (properties.numberOfRunningPostOfferSearches >= properties.maxPostOfferSearches && typeof locationId === 'undefined') {
            setTimeout(function(){
                self.createOfferSearch(userSearchConfigKey,locationId);
            },1000);
        } else {
            properties.numberOfRunningPostOfferSearches ++;
            var singleLocation = false;
            var offerSearch = {
                userSearchConfigKey: userSearchConfigKey,
                generateEmptyOffer: false,
                region: FG.properties.region
            };
            if (typeof locationId !== 'undefined') {
                offerSearch.locationIds = [locationId];
                singleLocation = true;
            }
            FG.createOfferSearch({
                offerSearch: offerSearch,
                ajax: {
                    success: function(data){
                        var offerSearchKey = data.key;
                        if (singleLocation) {
                            properties.vehicleOffers[vehicleTypeId].myExtraOfferSearchKey = offerSearchKey;
                        } else {
                            properties.vehicleOffers[vehicleTypeId].offerSearchKey = offerSearchKey;
                            properties.vehicleOffers[vehicleTypeId].offers = [];
                        }
                        getOffers({
                            offerSearchKey: offerSearchKey,
                            vehicleTypeId: vehicleTypeId,
                            locationId: locationId
                        });
                    },
                    error: function(){
                        $(selector.mask, model).hide();
                        $(selector.error, model).show();
                    },
                    complete: function(){
                        properties.numberOfRunningPostOfferSearches --;
                    }
                }
            });
        }
    };

    /**
      * @desc create offer searches for the vehicle
      * @param {array} vehicles, the keys are:
          * @key {number} id: vehicle type ID
          * @key {string} name: vehicle name
    */
    self.displayVehicles = function(vehicles){
        model.show();
        self.showMask();
        var newVehicles = {};
        var keys = [];
        $.each(vehicles,function(){
            var id = this.id;
            keys.push(id);
            newVehicles[id.toString()] = this.name;
        });
        $.each(keys.sort(function(a,b){return a - b;}),function(){
            var id = this.toString();
            //console.log(newVehicles[id]);
            var html = $(selector.template.offer, model).clone();
            html.attr('id','VT_'+id).addClass('checkingOffers');
            html.find('.vehicle').html(newVehicles[id]);
            model.append(html);
        });
    };

    /**
      * @desc get properties
    */
    self.getProperties = function(){
        return properties;
    };

    /**
      * @desc get offers from an offerSearchKey
      * @param {object} obj, the keys are:
          * @key {string or number} vehicleTypeId
          * @key {string} offerSearchKey
    */
    function getOffers(obj){
        var vehicleTypeId = obj.vehicleTypeId;
        var criteria = {
            limit: (properties.offerPerVehicle > 0 ? properties.offerPerVehicle : 99),
            offset: 0
        };
        if (typeof obj.locationId !== 'undefined') {
            criteria.locationIds = obj.locationId;
            var isLocationOffer = true;
        }
        FG.getOfferList({
            offerSearchKey: obj.offerSearchKey,
            criteria: criteria,
            ajax: {
                success: function(data){
                    properties.vehicleOffers[vehicleTypeId].numberOfOffers = data.length;
                    if (isLocationOffer) {
                        if (data.length === 0) {
                            $('#VT_' + vehicleTypeId, model).addClass('noOfferForLocation').removeClass('checkingOffers');
                            triggerOfferCompleteForVehicle(vehicleTypeId);
                        } else {
                            getOffer({
                                offerKey: data[0].offerKey,
                                vehicleTypeId: vehicleTypeId,
                                isLocationOffer: isLocationOffer
                            });
                        }
                    } else {
                        if (data.length === 0) {
                            $('#VT_' + vehicleTypeId, model).addClass('noOffer').removeClass('checkingOffers');
                            incrementNumberOfOfferSearchesFinished();
                        } else {
                            $.each(data,function(){
                                var offerKey = this.offerKey;
                                getOffer({
                                    offerKey: offerKey,
                                    vehicleTypeId: vehicleTypeId
                                });
                            });
                        }
                    }
                }
            }
        });
    }

    /**
      * @desc create an object for net values
      * @param {array} array, array of values to be set, for "net", "laborNet", "partNet", "fluidNet", "fixedNet", "lacquerNet"
      * @return {object} output, object whose keys are the net names, and values of the corresponding keys
    */
    function createNetValues(array){
        if (array.length !== 6) {// number of elements in array is wrong
            return console.error('number of elements in array as argument for function createNetValues() is wrong');
        }
        var output = {
            net: array[0],
            laborNet: array[1],
            partNet: array[2],
            fluidNet: array[3],
            fixedNet: array[4],
            lacquerNet: array[5]
        };
        return output;
    }

    /**
      * @desc get single offer
      * @param {object} obj, keys:
          * @key {string or number} vehicleTypeId
          * @key {string} offerKey
    */
    function getOffer(obj){
        var vehicleTypeId = obj.vehicleTypeId;
        var offerKey = obj.offerKey;
        var isLocationOffer = obj.isLocationOffer;
        FG.getOffer({
            offerKey: offerKey,
            ajax: {
                success: function(data){
                    storeSectionDetails({
                        data: data,
                        offerKey: offerKey,
                        vehicleTypeId: vehicleTypeId
                    });
                },
                error: function(){
                    properties.vehicleOffers[vehicleTypeId].offers.push({
                        offerKey: offerKey
                    });
                },
                complete: function(){
                    properties.isFirstOffer = false;
                    if (properties.vehicleOffers[vehicleTypeId].offers.length >= properties.vehicleOffers[vehicleTypeId].numberOfOffers) {// all offers are loaded: equality, when every standard offer is loaded; length = numberOfOffers + 1, when the additional offer search is made
                        if (typeof properties.vehicleOffers[vehicleTypeId].myOffer === 'undefined' && typeof properties.location !== 'undefined' && typeof properties.location.id !== 'undefined') {
                            var vehicle = {
                                vehicleType: {id: vehicleTypeId},
                                constructionTime: properties.vehicleOffers[vehicleTypeId].constructionTime
                            };
                            self.createUserSearch(vehicle,properties.location.id);
                        } else {
                            triggerOfferCompleteForVehicle(vehicleTypeId);
                        }
                    }
                }
            }
        });
    }

    /**
      * @desc triggers when all offers for a vehicle have been found
      * @param {string} vehicleTypeId
    */
    function triggerOfferCompleteForVehicle(vehicleTypeId){
        PB.increment(progressBarName);
        getPriceRanges(vehicleTypeId);
    }

    /**
      * @desc store section details in properties
      * @param {string} offerKey
      * @param {object} data, FairGarage offer data
    */
    function storeSectionDetails(obj){
        var offerKey = obj.offerKey;
        var data = obj.data;
        var vehicleTypeId = obj.vehicleTypeId;
        var section = 'regularSections';
        if (properties.isFirstOffer === true) {
            properties.offerCalculation = createNetValues([[],[],[],[],[],[]]);
            delete properties.offerCalculation.net;
            $.each(data[section],function(){
                var key = '';
                switch (this.type) {
                    case 1:// labor
                        key = 'laborNet';
                        break;
                    case 2:// part
                        key = 'partNet';
                        break;
                    case 3:// fluid
                        key = 'fluidNet';
                        break;
                    case 4:// fixed
                        key = 'fixedNet';
                        break;
                    case 7:// lacquer
                        key = 'lacquerNet';
                        break;
                    default:
                        break;
                }
                if (key !== '') {
                    $.each(this.positions,function(){
                        properties.offerCalculation[key].push({
                            name: this.name,
                            unitPrice: this.unitPrice,
                            amount: this.amount
                        });
                    });
                }
            });
        }
        var laborNet, partNet, fluidNet, fixedNet, lacquerNet;
        $.each(data[section],function(){
            switch (this.type) {
                case 1:// labor
                    laborNet = this.regularNetRate;
                    break;
                case 2:// part
                    partNet = this.regularNetRate;
                    break;
                case 3:// fluid
                    fluidNet = this.regularNetRate;
                    break;
                case 4:// fixed
                    fixedNet = this.regularNetRate;
                    break;
                case 7:// lacquer
                    lacquerNet = this.regularNetRate;
                    break;
                default:
                    break;
            }
        });
        var offer1 = {offerKey: offerKey};
        var offer2 = createNetValues([data.regularNetRate,laborNet,partNet,fluidNet,fixedNet,lacquerNet]);
        var offer = $.extend(offer1,offer2);
        properties.vehicleOffers[vehicleTypeId].offers.push(offer);
        if (typeof properties.location !== 'undefined' && data.locationId === properties.location.id) {
            properties.vehicleOffers[vehicleTypeId].myOffer = offer;
        }
    }

    /**
      * @desc get price ranges of each price section
      * @param {ID} vehicleTypeId, vehicle type ID
    */
    function getPriceRanges(vehicleTypeId){
        var netValues = [], laborNetValues = [], partNetValues = [], fluidNetValues = [], fixedNetValues = [], lacquerNetValues = [];
        $.each(properties.vehicleOffers[vehicleTypeId].offers,function(){
            if (typeof this.net !== 'undefined') {
                netValues.push(this.net);
            }
            if (typeof this.laborNet !== 'undefined') {
                laborNetValues.push(this.laborNet);
            }
            if (typeof this.partNet !== 'undefined') {
                partNetValues.push(this.partNet);
            }
            if (typeof this.fluidNet !== 'undefined') {
                fluidNetValues.push(this.fluidNet);
            }
            if (typeof this.fixedNet !== 'undefined') {
                fixedNetValues.push(this.fixedNet);
            }
            if (typeof this.lacquerNet !== 'undefined') {
                lacquerNetValues.push(this.lacquerNet);
            }
        });
        var range = createNetValues([setRange(netValues), setRange(laborNetValues), setRange(partNetValues), setRange(fluidNetValues), setRange(fixedNetValues), setRange(lacquerNetValues)]);
        properties.vehicleOffers[vehicleTypeId].ranges = range;
        displayVehiclePriceRange(vehicleTypeId,range);
        incrementNumberOfOfferSearchesFinished();
    }

    /**
      * @desc increment the number of finished offer searches, and check whether to trigger offer comparison finished
    */
    function incrementNumberOfOfferSearchesFinished(){
        properties.numberOfOfferSearchesFinished ++;
        if (properties.numberOfOfferSearches !== 0 && properties.numberOfOfferSearches === properties.numberOfOfferSearchesFinished) {
            highlightNoServiceVehicles();
            //TODO: hideUselessColumns()
            triggerOfferComparisonFinished();
        }
    }

    /**
      * @desc display the price ranges found for a vehicle
      * @param {string or number} vehicleTypeId
      * @param {object} range, the values of the keys are array of min and max 2 values (or null)
          * @key {array} net
          * @key {array} laborNet
          * @key {array} partNet
          * @key {array} fluidNet
          * @key {array} fixedNet
          * @key {array} lacquerNet
    */
    function displayVehiclePriceRange(vehicleTypeId,range){
        var row = $('#VT_' + vehicleTypeId, model);
        if (row.length === 0) {
            setTimeout(function(){
                displayVehiclePriceRange(vehicleTypeId,range);
            },1000);
        } else {
            row.removeClass('checkingOffers');
            var selectors = ['.laborNetMin','.laborNetMax','.partNetMin','.partNetMax','.fluidNetMin','.fluidNetMax','.fixedNetMin','.fixedNetMax','.lacquerNetMin','.lacquerNetMax','.netMin','.netMax'];
            var values = [range.laborNet[0],range.laborNet[1],range.partNet[0],range.partNet[1],range.fluidNet[0],range.fluidNet[1],range.fixedNet[0],range.fixedNet[1],range.lacquerNet[0],range.lacquerNet[1],range.net[0],range.net[1]];
            displayValuesInRow(row,selectors,values);
            displayMyPrices(row,vehicleTypeId);
        }
    }

    /**
      * @desc display the values in HTML
      * @param {jQeury element} row
      * @param {array} selectors, the selectors for the values
      * @param {array} values, the values to be displayed
    */
    function displayValuesInRow(row,selectors,values){
        for (var i = 0; i < values.length; i ++) {
            var value = values[i];
            if (typeof value === 'number' || typeof value === 'string') {
                row.find(selectors[i]).html((Number(value)).toFixed(2));
            } else {
                row.find(selectors[i]).addClass('excluded');
            }
        }
    }

    /**
      * @desc display my price for a vehicle
      * @param {jQeury element} row
      * @param {string or number} vehicleTypeId
    */
    function displayMyPrices(row,vehicleTypeId){
        if (typeof properties.vehicleOffers[vehicleTypeId].myOffer !== 'undefined') {
            var selectors = ['.laborNetMe','.partNetMe','.fluidNetMe','.fixedNetMe','.lacquerNetMe','.netMe'];
            var myOffer = properties.vehicleOffers[vehicleTypeId].myOffer;
            var values = [myOffer.laborNet, myOffer.partNet, myOffer.fluidNet, myOffer.fixedNet, myOffer.lacquerNet, myOffer.net];
            displayValuesInRow(row,selectors,values);
        }
    }

    /**
      * @desc highlight rows corresponding to not valid vehicles
    */
    function highlightNoServiceVehicles(){
        $('.checkingOffers', model).not('.noOffer').not('.noOfferForLocation').addClass('noService').removeClass('checkingOffers');
    }

    /**
      * @desc get min value in array
      * @param {array} array
    */
    function getMinInArray(array){
        if (array.length === 0) {
            return null;
        } else {
            return Math.min.apply(null, array);
        }
    }

    /**
      * @desc get max value in array
      * @param {array} array
    */
    function getMaxInArray(array){
        if (array.length === 0) {
            return null;
        } else {
            return Math.max.apply(null, array);
        }
    }

    /**
      * @desc get min and max value of array
      * @param {array} array
      * @return {array} [min max]
    */
    function setRange(array){
        return [getMinInArray(array), getMaxInArray(array)];
    }

    /**
      * @desc triggers when all offer comparison are finished
    */
    function triggerOfferComparisonFinished(){
        console.log('offer comparison finished');
        PB.complete(progressBarName);
        self.hideMask();
    }

    return self;
};
