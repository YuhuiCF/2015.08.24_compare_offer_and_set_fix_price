
var selector = selector || {};

selector.model = selector.model || {};
selector.model.regionSelection = '#regionSelection';

var regionSelection = function(obj){
    var FG = obj.FG;
    if (typeof FG === 'undefined') {
        return console.error('FairGarage is not defined');
    }
    var model = obj.model;
    if (typeof model === 'undefined') {
        return console.error('model is not defined');
    } else {
        model = $(model);
    }

    var selector = {
        input: {
            region: 'input'
        },
        ul: {
            region: 'ul'
        },
        li: {
            region: 'li'
        },
        span: {
            regionSelected: '.selectionCompleted span'
        }
    }
    
    $(selector.input.region, model).val('');

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
    function searchRegion(name){
        currentKey = name;
        if (currentKey !== oldKey) {
            oldKey = currentKey;
            searchStartCounter++;
            FG.findRegion({
                criteria: {
                    searchTerm: name
                },
                ajax: {
                    success: function(data){
                        searchEndCounter++;
                        if (searchEndCounter === searchStartCounter) {// latest search finished, show the results
                            var regionUl = $(selector.ul.region, model);
                            regionUl.empty();
                            $.each(data,function(){
                                regionUl.append('<li>' + this.formattedName + '</li>');
                                regionUl.find('li:last').data('data',this);
                            });
                            // bind click on these li elements
                            $(selector.li.region, model).bind('click',function(){
                                var region = $(this).data('data');
                                selectRegion(region);
                            });
                        }
                    }
                }
            });
        }
    };
    // bind the function to multiple events of region select
    $(selector.input.region, model).bind('change keyup mouseup',function(){
        var value = $(this).val();
        if (value !== '') {
            searchRegion(value);    
        }
    });

    /** 
      * @desc select a region by FairGarage region object
      * @param {object} region, region data
    */
    function selectRegion(region){
        $(selector.ul.region, model).empty();
        $(selector.input.region, model).val('');
        $(selector.span.regionSelected, model).html(region.formattedName);
        FG.properties.region = region;
    }

};

regionSelection({
    FG: FG,
    model: selector.model.regionSelection
});
