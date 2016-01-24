
function hideProgressBar(){
	$('#progressBar').hide();
}

function showProgressBar(){
	$('#progressBar').show();
}

var contextKey = 'FAIAZUQWy6CH';
var FG = fg({
    contextKey: contextKey,
    env: 'api-qa'
});


var selector = {
	model: {
		serviceSelection: '#serviceSelection',
		offerComparison: '#offerComparison',
		locationSelection: '#locationSelection',
		vehicleSelection: '#vehicleSelection'
	}
};

var OF = offers({
    FG: FG,
    model: selector.model.offerComparison
});

var PB = new ProgressBar({
    model: '#progressBar'
});

var SS = new serviceSelection({
    FG: FG,
    model: selector.model.serviceSelection
});

locationSelection({
    FG: FG,
    OF: OF,
    model: selector.model.locationSelection,
    signature: '45813b51f79b225aee020457ec2e1b99-b85b81a159c28165ae7a26dc96c5bf39',
    searchForLocation: true,
    locationId: 29
});

var VS = new vehicleSelection({
    FG: FG,
    OF: OF,
    PB: PB,
    model: selector.model.vehicleSelection,
    compareWhenAllVehiclesFound: true,
    numberOfMaxValidVehicles: 20
    /*,
    foundVehicleLimit: 20*/
});

var hooks = {};
hooks['progressBar:complete'] = function(){
	hideProgressBar();
	VS.enableAllSelection();
};
