
(function($){

    var console = window.console || {};
    console.error = window.console.error || function(){};

    window.fg = function(fgObj){
        var self = {};
        var varPrivate = {};

        self.properties = {
            ssl: 'https',
            env: 'api',
            apiBase: '.fairgarage.de/smp/api/',
            languageCode: 'de',
            countryCode: 'DE'
        };

        /**
          * @desc set properties in self.properties
          * @param {object} newProperties - object with new properties to be added/modified
              * @key {string} apiBase - base URL of FairGarage API, default value is '.fairgarage.de/smp/api/'
              * @key {string} contextKey - context key used in FairGarage API
              * @key {string} countryCode - country code; "DE", "GB", "PL", or other country codes that can be found by function findCountryConfig(), default value 'DE'
              * @key {string} env - environment of FairGarage API, default value is 'api'
              * @key {function} error - default error function to be used in FairGarage API
              * @key {string} languageCode - language code; "de", "en", "pl", or other language codes that can be found by function findCountryConfig(), default value 'de'
              * @key {string} ssl - 'https' (default) or 'http'
              * @key {object} selectedVehicle - the vehicle object used in FairGarage API. It has 3 keys:
                    @key {object} constructionTime: the construction time object has one key, 'time', which stores the timestamp of the construction time of the vehicle. The value could be automatically saved, if saveVehicle in the corresponding functions is set to true.
                    @key {array of objects} equipmentList: each object of the list is a FairGarage equipment object
                    @key {object} vehicleType: the FairGarage vehicle object
        */
        self.setProperties = function(newProperties){
            extend(self.properties,newProperties);
        };
        self.setProperties(fgObj);

        /**
          * @desc get property in self.properties
          * @param {string} propertyName - object with new properties to be added/modified
          * @return the value of the property, otherwise null, if propertyName not defined
        */
        self.getProperty = function(propertyName){
            return self.properties[propertyName];
        };

        /**
          * @desc remove properties in self.properties
          * @param {array of strings} properties - array with names of properties to be added/modified in self.properties
        */
        self.removeProperties = function(properties){
            $.each(properties,function(){
                delete self.properties[this.toString()];
            });
        };

        /**
          * @desc ajax request
          * @param {object} obj - obj for jQuery ajax() function,
                                    except modifications in "url", "error"
        */
        self.api = function(obj){
            var functionName = obj.functionName || 'api';
            var type = obj.type || 'GET';
            var urlParam = obj.urlParam || {};
            var url = (($.inArray(self.getProperty('ssl'),['http','https']) >= 0) ? self.getProperty('ssl') : 'https') + '://' + self.getProperty('env') + self.getProperty('apiBase') + (obj.apiUrl || 'authentication/current') + (varPrivate.sessionId ? ';jsessionid=' + varPrivate.sessionId : '') + ('?' + $.param(extend({contextKey:self.getProperty('contextKey')},urlParam)));
            //var forceNoSession = obj.forceNoSession ? true : false;
            //url = forceNoSession ? url : appendSession(url);
            var error = obj.error || function(jqXHR,textStatus,errorThrown){
                try {
                    var errMsg = [];
                    $.each(jqXHR.responseJSON,function(){
                        var temp;
                        if (this.field) {
                            temp = this.field.split('.')[1] || this.field.split('.')[0] + ' of the payload' + (this.errorMessage ? ', ' + this.errorMessage : ' error');
                        } else {
                            temp = this.errorMessage;
                        }
                        errMsg.push(temp);
                    });
                    self.error('Network Error: ' + textStatus + ', ' + errorThrown + '. ' + errMsg.join('; '));
                } catch (err) {
                    self.error('Error in FairGarage API when trying to use function ' + functionName + '()');
                }
            };

            var ajaxObj = {
                crossDomain: true,
                type: type,
                async: obj.async || true,
                cache: obj.cache || false,
                url: url,
                contentType: obj.contentType || 'application/json;charset=UTF-8',
                dataType: obj.dataType || 'json',
                data: obj.data || '',
                error: error
            };

            ajaxObj = extend(obj,ajaxObj);

            $.ajax(ajaxObj);
        };

        /**
          * @desc show error with error message in console
          * @param {string} str - message string
        */
        self.error = function(str){
            console.error(str);
        };

        /**
          * @desc check whether given variable has given type
          * @param variable - variable to be analysed
          * @param {string} expectedType - expected type of the variable
          * @return {boolean} given variable is of expected type or not
        */
        function isType(variable, expectedType){
            return typeof(variable) === expectedType;
        }

        /**
          * @desc private each function
          * @param {array} array - array of items
          * @param {function} handle - function applied to each of the item. This function takes 2 parameters:
              * @param item - current item of the array
              * @param index - index of current item
        */
        function each(array, handle){
            $.each(array,handle);
        }

        /**
          * @desc private extend function
          * @param {object} target - object to be extended
          * @param {object} object - properties of this object would be merged in
          * @param {boolean} deep - extend deep or not; default value true
        */
        function extend(target, object, deep){
            if (!isType(deep,'boolean')) {
                return $.extend(true, target, object);
            } else {
                return $.extend(deep, target, object);
            }
        }

        /**
          * @desc get first construction time of the vehicle in FairGarage date format to timestamp number
          * @param {object} constructionTimeMap - vehicle construction time map in FairGarage format
          * @return {string} FairGarage date, YYYY-MM-01
        */
        self.getFirstDateInConstructionTimeMap = function(constructionTimeMap){
            var years = [];
            for (var year in constructionTimeMap) {
                years.push(year);
            }
            var thisYear = years.sort()[0];
            return (thisYear + '-' + ('0' + constructionTimeMap[thisYear].sort(function(a,b){return a-b;})[0]).slice(-2) + '-01');
        };

        /**
          * @desc convert FairGarage date string to UTC timestamp number
          * @param {string} date - FairGarage date string, in the format YYYY-MM-01
          * @return {number} timestamp
        */
        self.dateToTimestamp = function(date){
            if (!(/\d{4}\-\d{2}\-01/.test(date) || /\d{4}\-\d{1}\-01/.test(date))) {
                return self.error('Please write the date in the format YYYY-MM-01, e.g. "2008-01-01"');
            }
            var year = date.split('-')[0];
            var month = parseInt(date.split('-')[1])-1;
            //return (new Date(year,month)).getTime();
            return Date.UTC([year,month]);
        };

        /**
          * @desc convert timestamp number to FairGarage date string
          * @param {number} timestamp
          * @return {string} date - FairGarage date string, in the format YYYY-MM-01
        */
        self.timestampToDate = function(timestamp){
            var time = new Date(timestamp);
            var year = time.getFullYear();
            var month = time.getMonth() + 1;
            var date = year + '-' + ('0' + month).slice(-2) + '-01';
            return date;
        };

        /** areMandatoryParmsSet
          * @desc check if given mandatory parameters are set correctly
          * @param {array} paramConfigs - configuration objects for each parameter. The structure for each object:
              * @param {string} paramName - name of the parameter
              * @param {string} paramType - javascript type of the parameter
              * @param {string} (opt) parentObj - if this mandatory parameter is a key of a mandatory object, indicate the 'parent' object here
              * @param (opt) defaultValue - default value of the parameter
          * @return {string} boolean - whether all mandatory parameters are set or not
        */
        self.areMandatoryParmsSet = function(functionName,pobj,paramConfigs){
            var missingMandatoryParams = [];
            $.each(paramConfigs,function(i,config){
                var paramName = config.paramName;//string
                var paramType = config.paramType;//string
                var parentObj = config.parentObj;//string
                var defaultValue = config.defaultValue;
                var isMissing = false;
                if (isType(pobj[parentObj],'undefined')) {// this is the parent object
                    if (isType(pobj[paramName],'undefined')) {// this parameter is not given
                        if (!isType(defaultValue,'undefined')) {// default value is given
                            pobj[paramName] = defaultValue;
                        } else {// default value is not given
                            if (paramType === 'object') {// set empty object, such that its mandatory fields would be indicated
                                pobj[paramName] = {};
                            }
                            isMissing = true;
                        }
                    }
                } else {// this is a field of the parent object
                    if (isType(pobj[parentObj][paramName],'undefined')) {// this parameter is not given
                        if (!isType(defaultValue,'undefined')) {// default value is given
                            pobj[paramName] = defaultValue;
                        } else {// default value is not given
                            isMissing = true;
                        }
                    }

                }
                if (isMissing) {
                    missingMandatoryParams.push('"' + paramName + '" of type "' + paramType + '"' + (isType(parentObj,'undefined') ? '' : ' in "' + parentObj + '"' ));
                }
            });
            if (missingMandatoryParams.length > 0) {
                self.error('Please indicate in function ' + functionName + '(): ' + missingMandatoryParams.join(', '));
                return [false,pobj];
            } else {
                return [true,pobj];
            }
        };

        /**
          * @desc get location, API base path: /smp/api/locations, API full path: /smp/api/locations/{locationId}
          * @param {object} pobj
              * @key {string} locationId - ID of the location; if not set, default value would be self.getProperty('locationId')
              * @key {object} ajax (opt) - key/value pairs of jQuery ajax() to be added/overwritten, if allowed
        */
        self.getLocation = function(pobj){
            if (isType(pobj,'undefined')) {
                pobj = {};
            }
            var functionName = 'getLocation';
            var ajax = pobj.ajax || {};
            // check mandatory fields start
            var paramConfigs = [
                {
                    paramName: 'locationId',
                    paramType: 'string'
                }
            ];
            var paramsSetResult = self.areMandatoryParmsSet(functionName,pobj,paramConfigs);
            var areParamsSet = paramsSetResult[0];
            pobj = paramsSetResult[1];
            if (!areParamsSet){
                return;
            }
            // check mandatory fields end
            var locationId = !isType(pobj.locationId,'undefined') ? pobj.locationId : self.getProperty('locationId');
            var obj = {
                apiUrl: 'locations/' + locationId,
                functionName: functionName + '()'
            };
            self.api($.extend(obj,ajax));
        };

        /**
          * @desc get offer by offer key, API base path: /smp/api/offers, API full path: /smp/api/offers/{offerKey}/details
          * @param {object} pobj
              * @key {string} offerKey - offer key
              * @key {object} criteria (opt) - criteria to show the offer; for more details, please refer to the description in http://www.fairgarage.de/smp/apitester/
              * @key {object} ajax (opt) - key/value pairs of jQuery ajax() to be added/overwritten, if allowed
        */
        self.getOffer = function(pobj){
            if (isType(pobj,'undefined')) {
                pobj = {};
            }
            var functionName = 'getOffer';
            var ajax = pobj.ajax || {};
            //----- check mandatory fields start
            var paramConfigs = [
                {
                    paramName: 'offerKey',
                    paramType: 'string'
                }
            ];
            var paramsSetResult = self.areMandatoryParmsSet(functionName,pobj,paramConfigs);
            var areParamsSet = paramsSetResult[0];
            pobj = paramsSetResult[1];
            if (!areParamsSet){
                return;
            }
            //----- check mandatory fields end
            var offerKey = pobj.offerKey;
            var criteria = pobj.criteria;
            var obj = {
                apiUrl: 'offers/' + offerKey + '/details',
                urlParam: criteria,
                functionName: functionName + '()'
            };
            self.api(extend(obj,ajax));
        };

        /**
          * @desc get offer list, API base path: /smp/api/offers, API full path: /smp/api/offers/{offerSearchKey}
          * @param {object} pobj
              * @key {string} offerSearchKey - offer search key
              * @key {object} criteria (opt) - criteria to show the results; for more details, please refer to the description in http://www.fairgarage.de/smp/apitester/
                  * @key {number or string} limit (opt) (API url parameter) - number of the results
                  * @key {number or string} offset (opt) (API url parameter) - offset of the results
              * @key {object} ajax (opt) - key/value pairs of jQuery ajax() to be added/overwritten, if allowed
        */
        self.getOfferList = function(pobj){
            if (isType(pobj,'undefined')) {
                pobj = {};
            }
            var functionName = 'getOfferList';
            var ajax = pobj.ajax || {};
            //----- check mandatory fields start
            var paramConfigs = [
                {
                    paramName: 'offerSearchKey',
                    paramType: 'string'
                }
            ];
            var paramsSetResult = self.areMandatoryParmsSet(functionName,pobj,paramConfigs);
            var areParamsSet = paramsSetResult[0];
            pobj = paramsSetResult[1];
            if (!areParamsSet){
                return;
            }
            //----- check mandatory fields end
            var offerSearchKey = pobj.offerSearchKey;
            var criteria = pobj.criteria;
            var obj = {
                apiUrl: 'offers/' + offerSearchKey,
                urlParam: criteria,
                functionName: functionName + '()'
            };
            self.api(extend(obj,ajax));
        };

        /**
          * @desc create offer search, API base path: /smp/api/offersearches, API full path: /smp/api/offersearches
          * @param {object} pobj
              * @key {object} offerSearch - use user search key and region to create an offer search; for more details, please refer to the description in http://www.fairgarage.de/smp/apitester/
                  * @key {object} userSearchConfigKey - user search key
                  * @key {object} region (opt) - search offers in the given region
                  * @key {boolean} generateEmptyOffer (opt) - whether locations with no offer will be included in the result list
              * @key {object} ajax (opt) - key/value pairs of jQuery ajax() to be added/overwritten, if allowed
        */
        self.createOfferSearch = function(pobj){
            if (isType(pobj,'undefined')) {
                pobj = {};
            }
            var functionName = 'createOfferSearch';
            var ajax = pobj.ajax || {};
            //----- check mandatory fields start
            var paramConfigs = [
                {
                    paramName: 'offerSearch',
                    paramType: 'object'
                },{
                    paramName: 'userSearchConfigKey',
                    paramType: 'object',
                    parentObj: 'offerSearch'
                }
            ];
            var paramsSetResult = self.areMandatoryParmsSet(functionName,pobj,paramConfigs);
            var areParamsSet = paramsSetResult[0];
            pobj = paramsSetResult[1];
            if (!areParamsSet){
                return;
            }
            //----- check mandatory fields end
            var offerSearch = pobj.offerSearch;
            var obj = {
                type: 'POST',
                apiUrl: 'offersearches',
                data: JSON.stringify(offerSearch),
                functionName: functionName + '()'
            };
            self.api(extend(obj,ajax));
        };

        /**
          * @desc find service, API base path: /smp/api/services/services, API full path: /smp/api/services/services
          * @param {object} pobj
              * @key {object} criteria (opt) - search criteria; for more details, please refer to the description in http://www.fairgarage.de/smp/apitester/
                  * @key {string} searchTerm (opt) (API url parameter) - search term, name of the service
                  * @key {string} vehicleTypeId (opt) (API url parameter) - ID of vehicle type
                  * @key {string} constructionTime (opt) (API url parameter) - construction time of the vehicle, in the UTC milliseconds format
                  * @key {number or string} offset (opt) (API url parameter) - offset of the results
                  * @key {number or string} limit (opt) (API url parameter) - number of the results
              * @key {function} quickHandle (opt) - quickHandle function with parameter (data) of type array of objects
                    The structure of each object in parameter data:
                        serviceId - number, ID of service
                        serviceName - string, name of the service
              * @key {object} ajax (opt) - key/value pairs of jQuery ajax() to be added/overwritten, if allowed
        */
        self.findService = function(pobj){
            if (isType(pobj,'undefined')) {
                pobj = {};
            }
            var functionName = 'findService';
            var ajax = pobj.ajax || {};
            var criteria = pobj.criteria;
            var quickHandle = pobj.quickHandle;
            var success = ajax.success;
            var obj = {
                apiUrl: 'services/services',
                urlParam: criteria,
                success: function(data){
                    if (isType(quickHandle,'function')) {
                        var newData = [];
                        $.each(data,function(){
                            newData.push({
                                serviceId: this.id,
                                serviceName: this.name
                            });
                        });
                        quickHandle(newData);
                    }
                    if (isType(success,'function')) {success(data);}
                },
                functionName: functionName + '()'
            };
            delete ajax.success;
            self.api(extend(obj,ajax));
        };

        /**
          * @desc get service by service ID, API base path: /smp/api/services/services, API full path: /smp/api/services/services/{id}
          * @param {object} pobj
              * @key {string} serviceId - ID of service
              * @key {object} criteria (opt) - search criteria; for more details, please refer to the description in http://www.fairgarage.de/smp/apitester/
                  * @key {string} constructionTime (opt) (API url parameter) - construction time of the vehicle, in the UTC milliseconds format
                  * @key {string} vehicleTypeId (opt) (API url parameter) - ID of vehicle type
              * @key {object} ajax (opt) - key/value pairs of jQuery ajax() to be added/overwritten, if allowed
        */
        self.getServiceById = function(pobj){
            if (isType(pobj,'undefined')) {
                pobj = {};
            }
            var functionName = 'getServiceById';
            var ajax = pobj.ajax || {};
            //----- check mandatory fields start
            var paramConfigs = [
                {
                    paramName: 'serviceId',
                    paramType: 'string'
                }
            ];
            var paramsSetResult = self.areMandatoryParmsSet(functionName,pobj,paramConfigs);
            var areParamsSet = paramsSetResult[0];
            pobj = paramsSetResult[1];
            if (!areParamsSet){
                return;
            }
            //----- check mandatory fields end
            var serviceId = pobj.serviceId;
            var criteria = pobj.criteria;
            var obj = {
                apiUrl: 'services/services/' + serviceId,
                urlParam: criteria,
                functionName: functionName + '()'
            };
            self.api(extend(obj,ajax));
        };

        /**
          * @desc create user search, API base path: /smp/api/usersearches, API full path: /smp/api/usersearches
          * @param {object} pobj
              * @key {object} userSearchData - use vehicle, and service to create a user search
                  * @key {object} selectedVehicle - selected vehicle
                  * @key {array of objects} selectedServiceList - list of selected services
              * @key {object} ajax (opt) - key/value pairs of jQuery ajax() to be added/overwritten, if allowed
        */
        self.createUserSearch = function(pobj){
            if (isType(pobj,'undefined')) {
                pobj = {};
            }
            var functionName = 'createUserSearch';
            var ajax = pobj.ajax || {};
            //----- check mandatory fields start
            var paramConfigs = [
                {
                    paramName: 'userSearchData',
                    paramType: 'object'
                },{
                    paramName: 'selectedVehicle',
                    paramType: 'object',
                    parentObj: 'userSearchData'
                },{
                    paramName: 'selectedServiceList',
                    paramType: 'array of objects',
                    parentObj: 'userSearchData'
                }
            ];
            var paramsSetResult = self.areMandatoryParmsSet(functionName,pobj,paramConfigs);
            var areParamsSet = paramsSetResult[0];
            pobj = paramsSetResult[1];
            if (!areParamsSet){
                return;
            }
            //----- check mandatory fields end
            var userSearchData = pobj.userSearchData;
            var obj = {
                type: 'POST',
                apiUrl: 'usersearches',
                data: JSON.stringify(userSearchData),
                functionName: functionName + '()'
            };
            self.api(extend(obj,ajax));
        };

        /**
          * @desc find vehicle by catalog, API base path: /smp/api/vehicles/catalog, API full path: /smp/api/vehicles/catalog/{vehicleCategoryId}
          * @param {object} pobj
              * @key {string} vehicleCategoryId - vehicle category ID. To find IDs of the next category, start with "62303" (default) for SUV/passenger cars, or "83503" for transporters
              * @key {object} criteria (opt) - search criteria; for more details, please refer to the description in http://www.fairgarage.de/smp/apitester/
                  * @key {string} constructionTime (opt) (API url parameter) - construction time of the vehicle, in the UTC milliseconds format
              * @key {function(data)} quickHandle (opt) - quickHandle function with parameter (data) of type array of objects.
                    The structure of each object in the parameter data:
                        {boolean} lastLevel - if the last category level is reached
                        {number} id - ID of the category; or ID of the vehicle type (if the last level is reached)
                        {string} name - name of the category
                        {string} externalId - external ID or Ecode of the vehicle (if the last level is reached)
                        {array of objects} properties - each of which are objects of the vehicle (if the last level is reached)
                            The structure of each property object:
                                {string} name - name of the property
                                {string} value - value of the property
              * @key {boolean} saveVehicle (opt) - save the found vehicle, if only one vehicle is found, by setProperties into "vehicle"
              * @key {object} ajax (opt) - key/value pairs of jQuery ajax() to be added/overwritten, if allowed
        */
        self.findVehicleByCatalog = function(pobj){
            if (isType(pobj,'undefined')) {
                pobj = {};
            }
            var functionName = 'findVehicleByCatalog';
            var ajax = pobj.ajax || {};
            //----- check mandatory fields start
            var paramConfigs = [
                {
                    paramName: 'vehicleCategoryId',
                    paramType: 'string'
                }
            ];
            var paramsSetResult = self.areMandatoryParmsSet(functionName,pobj,paramConfigs);
            var areParamsSet = paramsSetResult[0];
            pobj = paramsSetResult[1];
            if (!areParamsSet){
                return;
            }
            //----- check mandatory fields end
            var vehicleCategoryId = !isType(pobj.vehicleCategoryId,'undefined') ? pobj.vehicleCategoryId : '62303';
            var criteria = pobj.criteria;
            var quickHandle = pobj.quickHandle;
            var saveVehicle = pobj.saveVehicle;
            var success = ajax.success;
            var obj = {
                apiUrl: 'vehicles/catalog/' + vehicleCategoryId,
                urlParam: criteria,
                success: function(data){
                    if (saveVehicle && data.types.length == 1) {
                        var selectedVehicle = {
                            constructionTime: {time:null},
                            equipmentList: [],
                            vehicleType: data.types[0]
                        };
                        var years = [];
                        for (var year in data.types[0].constructionTimeMap) {
                            years.push(year);
                        }
                        var thisYear = years.sort()[0];
                        selectedVehicle.constructionTime.time = (criteria && criteria.constructionTime) ? self.dateToTimestamp(criteria.constructionTime) : self.dateToTimestamp(thisYear + '-' + (data.types[0].constructionTimeMap[thisYear].sort(function(a,b){return a-b;})[0]));
                        //selectedVehicle.constructionTime.time = (criteria && criteria.constructionTime) ? self.dateToTimestamp(criteria.constructionTime) : self.dateToTimestamp(self.getFirstDateInConstructionTimeMap(data.types[0].constructionTimeMap)));
                        self.setProperties({selectedVehicle:selectedVehicle});
                    }
                    if (isType(quickHandle,'function')) {
                        var newData = [];
                        var key = 'categories';
                        if (data.types.length > 0) {
                            key = 'types';
                        }
                        $.each(data[key],function(){
                            newData.push({
                                lastLevel: key == 'types',
                                id: this.id,
                                name: this.name,
                                externalId: (key == 'types' ? this.externalId : null),
                                properties: []
                            });
                            $.each(this.properties,function(){
                                newData[newData.length - 1].properties.push({
                                    name: this.type.name,
                                    value: this.value
                                });
                            });
                        });
                        quickHandle(newData);
                    }
                    if (isType(success,'function')) {success(data);}
                },
                functionName: functionName + '()'
            };
            delete ajax.success;
            self.api(extend(obj,ajax));
        };

        /**
          * @desc get region by region signature, API base path: /smp/api/regions/signature, API full path: /smp/api/regions/signature/{signature}
          * @param {object} pobj
              * @key {string} signature - region signature
              * @key {function(data)} quickHandle (opt) - quickHandle function with parameter (data) of type object.
                    The structure of the parameter data:
                        formattedName - string, formatted name of the region
                        nearbyLocationCount - number, number of nearby locations
                        signature - string, region signature
              * @key {object} ajax (opt) - key/value pairs of jQuery ajax() to be added/overwritten, if allowed
        */
        self.getRegionBySignature = function(pobj){
            if (isType(pobj,'undefined')) {
                pobj = {};
            }
            var functionName = 'getRegionBySignature';
            var ajax = pobj.ajax || {};
            // check mandatory fields start
            var paramConfigs = [
                {
                    paramName: 'signature',
                    paramType: 'string'
                }
            ];
            var paramsSetResult = self.areMandatoryParmsSet(functionName,pobj,paramConfigs);
            var areParamsSet = paramsSetResult[0];
            pobj = paramsSetResult[1];
            if (!areParamsSet){
                return;
            }
            // check mandatory fields end
            var signature = pobj.signature;
            var quickHandle = pobj.quickHandle;
            var success = ajax.success;
            var obj = {
                apiUrl: 'regions/signature/' + signature,
                success: function(data){
                    if (isType(quickHandle,'function')) {
                        newData = {
                            formattedName: data.formattedName,
                            nearbyLocationCount: data.nearbyLocationCount,
                            signature: data.signature
                        };
                        quickHandle(newData);
                    }
                    if (isType(success,'function')) {success(data);}
                },
                functionName: functionName + '()'
            };
            delete ajax.success;
            self.api($.extend(obj,ajax));
        };

        return self;
    };

})(jQuery);