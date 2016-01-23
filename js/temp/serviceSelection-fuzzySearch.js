
var selector = selector || {};

selector.input = selector.input || {};
selector.input.service = '#serviceSelection input';

selector.ul = selector.ul || {};
selector.ul.service = '#serviceSelection ul';

selector.li = selector.li || {};
selector.li.service = '#serviceSelection li';

selector.span = selector.span || {};
selector.span.serviceSelected = '#serviceSelection .selectionCompleted span';

var serviceSelection = function(obj){
    $(document).ready(function(){
        $(selector.input.service).val('');
    })

    var FG = obj.FG;
    if (typeof FG === 'undefined') {
        return console.error('FairGarage is not defined');
    }

    var properties = {};
    var oldKey = '';
    var currentKey = '';
    var searchStartCounter = 0;
    var searchEndCounter = 0;

    /** 
      * @desc append options in the vehicle selection
      * @param {array} data, array of option objects. The structure of the option object:
          * @key {number} id, vehicle category ID
          * @key {string} name, category name
      * @param {object} jQSelect, the jQuery object of the select element to append the options
    */
    function searchService(name){
        currentKey = name;
        if (currentKey !== oldKey) {
            oldKey = currentKey;
            searchStartCounter++;
            FG.findService({
                criteria: {
                    searchTerm: name,
                    numResults: 10
                },
                ajax: {
                    success: function(data){
                        searchEndCounter++;
                        if (searchEndCounter === searchStartCounter) {// latest search finished, show the results
                            var serviceUl = $(selector.ul.service);
                            serviceUl.empty();
                            var newData = [];
                            for (var i = 0; i < 10; i++) {
                                serviceUl.append('<li>' + data[i].name + '</li>');
                                serviceUl.find('li:last').data('data',data[i]);
                            }
                        }
                    }
                }
            });
        }
    };
    // bind the function to multiple events of service select
    $(document).on('input propertychange',selector.input.service,function(){
        var value = $(this).val();
        if (value !== '') {
            searchService(value);    
        }
    });

    /** 
      * @desc select a service by FairGarage service object
      * @param {object} service, service data
    */
    function selectService(service){
        $(selector.ul.service).empty();
        $(selector.input.service).val('');
        $(selector.span.serviceSelected).html(service.name);
        FG.properties.service = service;
    }
    // bind the function to click event of service results
    $(document).on('click',selector.li.service,function(){
        var service = $(this).data('data');
        selectService(service);
    });

};

serviceSelection({
    FG: FG
});
