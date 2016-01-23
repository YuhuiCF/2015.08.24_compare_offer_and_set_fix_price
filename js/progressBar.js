
/*
<div some-model>
    Total progress: <span class="percentage">0</span>%
</div>
*/

/**
  * @desc ProgressBar constructor
  * @param {object} obj
    * @key {string} model, DOM selector, on which the model is used, default: ''
    * @key {object} hooks, callback functions are stored in ths object, with keys "progressBar:complete" or "progressBar:complete:{progressname}", default: {}
    * @key {number} percentageSelector, DOM selector of the percentage labell, default: '.percentage'
    * @key {number} precision, precision of the percentage number, default value is 0, i.e. results would be 99 instead of 99.0
*/
var ProgressBar = function(pobj){
    var self = this;
    var obj = typeof pobj !== 'undefined' ? pobj : {};
    var hooks = typeof obj.hooks !== 'undefined' ? obj.hooks : {};
    var model = typeof obj.model !== 'undefined' ? obj.model : '';
    var percentageSelector = typeof obj.percentageSelector !== 'undefined' ? obj.percentageSelector : '.percentage';
    var precision = typeof obj.precision !== 'undefined' ? obj.precision : 0;

    var incremented = false;
    var numberOfProgresses = 0;
    var numberOfCompletedProgresses = 0;
    var progresses = {};

    var selector = {
        percentage: percentageSelector
    };

    /**
      * @desc Progress constructor
      * @param {object} obj
        * @key {number} weight, weight of this progress, values smaller than 10 would be set to 10
        * @key {number} initStepSize, initial step size of the incremention of this progress. Its value should be less than 1/10 of the weight
    */
    var Progress = function(obj){
        var self = this;
        var weight = (typeof obj.weight !== 'undefined' && obj.weight >= 10) ? obj.weight : 10;
        var currentProgress = 0;
        var initStepSize = (typeof obj.initStepSize !== 'undefined' && obj.initStepSize <= weight/10) ? obj.initStepSize : 1;
        var numberOfChanges = 0;
        var score = 0;
        var isCompleted = false;

        self.linearIncrement = false;
        self.name = obj.name;
        self.maxScore = weight;

        /**
          * @desc increment the current progress
        */
        self.increment = function(){
            if (isCompleted !== true) {
                var factor = Math.pow(2,numberOfChanges);
                if (currentProgress + weight/factor >= weight) {
                    numberOfChanges++;
                    factor = Math.pow(2,numberOfChanges);
                }
                score ++;
                if (self.linearIncrement === true) {
                    currentProgress = Math.max(currentProgress,score/self.maxScore*weight);
                    if (self.maxScore === score) {
                        self.complete();
                    }
                } else {
                    currentProgress += 2*initStepSize/factor;
                }
            }
        };

        /**
          * @desc complete the current progress
        */
        self.complete = function(){
            isCompleted = true;
            currentProgress = weight;
            ++numberOfCompletedProgresses;
            /*
            if (
            typeof window.hooks !== 'undefined' &&
            typeof window.hooks['progressBar:complete:' + self.name] !== 'undefined') {
                window.hooks['progressBar:complete:' + self.name]();
            }
            */
            useHooks('progressBar:complete:' + self.name,hooks);
            checkAllCompleted();
        };

        /**
          * @desc increment the progress linearly for max score
          * @param {number} maxScore
        */
        self.incrementLinearly = function(maxScore){
            self.maxScore = maxScore;
            self.linearIncrement = true;
        };

        /**
          * @desc get weight of the progress
        */
        self.getWeight = function(){
            return weight;
        };

        /**
          * @desc get current value of the progress
        */
        self.getCurrentProgress = function(){
            return currentProgress;
        };
    };

    /**
      * @desc increment a progress linearly
      * @param {object} obj
        * @param {string} name, name of the sub progress
        * @param {number} maxScore, max score of the sub progress
    */
    self.incrementLinearly = function(obj){
        var name = obj.name;
        var maxScore = obj.maxScore;
        getProgress(name).incrementLinearly(maxScore);
        return self;
    };

    /**
      * @desc reset progress bar
    */
    self.reset = function(){
        incremented = false;
        numberOfProgresses = 0;
        numberOfCompletedProgresses = 0;
        progresses = {};
        return self.updateProgressBar();
    };

    /**
      * @desc create progress of the progress bar, only if no current progresses have been incremented
      * @param {object} obj
        * @param {string} name, name of the sub progress
        * @param {number} weight, weight of the sub progess
        * @param {number} initStepSize, initial step size of the sub progess
    */
    self.createNewProgress = function(pobj){
        var obj = typeof pobj !== 'undefined' ? pobj : {};
        var name = obj.name;
        if (typeof name !== 'undefined' && incremented === false) {
            progresses[name] = new Progress(obj);
            numberOfProgresses += 1;
            if (obj.incrementLinearly === true) {
                var maxScore = typeof obj.maxScore !== 'undefined' ? obj.maxScore : progresses[name].getWeight();
                return self.incrementLinearly({
                    name: name,
                    maxScore: maxScore
                });
            }
        }
        return self;
    };

    /**
      * @desc increment progress by name
      * @param {string} name, name of the progress
    */
    self.increment = function(name){
        incremented = true;
        getProgress(name).increment();
        self.updateProgressBar();
        return self;
    };

    /**
      * @desc complete progress by name
      * @param {string} name, name of the progress
    */
    self.complete = function(name){
        incremented = true;
        getProgress(name).complete();
        self.updateProgressBar();
        return self;
    };

    /**
      * @desc update total progress
    */
    self.updateProgressBar = function(){
        var element = document.querySelector(model + ' ' + selector.percentage);
        if (element !== null) {
            element.innerHTML = self.getPercentage();
        } else {
            console.info('Element for selector ' + selector.percentage + ' is not defined.');
        }
        return self;
    };

    /**
      * @desc get current progress, in percentage
      * @return {string} percentage
    */
    self.getPercentage = function(){
        var totalProgress = 0;
        var currentProgress = 0;
        var isAllLinear = true;
        var percentage = 0;
        for (var key in progresses) {
            totalProgress += progresses[key].getWeight();
            currentProgress += progresses[key].getCurrentProgress();
            if (progresses[key].linearIncrement !== true) {
                isAllLinear = false;
            }
        }
        if (totalProgress > 0) {
            percentage = Number(100*currentProgress/totalProgress);
            if (isAllLinear === false && numberOfCompletedProgresses !== numberOfProgresses) {
                percentage = Math.min(percentage, 99);
            }
        }
        return Number(percentage).toFixed(precision);
    };

    /**
      * @desc get progress of the progress bar with the progress name
      * @param {string} name, name of the progress
      * @return {object progress} progress
    */
    function getProgress(name){
        var progress = progresses[name];
        if (typeof progress === 'undefined') {
            //return console.error('Progress with name "' + name + '" is not defined.');
            throw new Error('Progress with name "' + name + '" is not defined.');
        } else {
            return progress;
        }
    }

    /**
      * @desc check if all progresses are completed, if true, the progressBar callback function will be triggered
    */
    function checkAllCompleted(){
        // all prgresses are completed, and the corresponding hooks function is defined
        /*
        if
        (numberOfCompletedProgresses === numberOfProgresses &&
        typeof window.hooks !== 'undefined' &&
        typeof window.hooks['progressBar:complete'] !== 'undefined') {
            window.hooks['progressBar:complete']();
        }
        */
        if (numberOfCompletedProgresses === numberOfProgresses) {
            useHooks('progressBar:complete',hooks);
        }
    }

    function useHooks(event,defaultHooks){
        // use defaultHooks
        if (
        typeof defaultHooks !== 'undefined' &&
        typeof defaultHooks[event] !== 'undefined') {
            defaultHooks[event]();
        } else {
            var windowHooks = window.hooks;
            if (
            typeof windowHooks !== 'undefined' &&
            typeof windowHooks[event] !== 'undefined') {
                windowHooks[event]();
            }
        }
    }

};
