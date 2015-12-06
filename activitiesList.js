//table statistics
starindex.activitiesList = Backbone.View.extend({
    events: {
        'click .activity-trigger' : function(e){
            this.chooseGroup($(e.currentTarget));
            return false;
        },
        'click li' : function(e) {
            this.chooseOneItem($(e.currentTarget));
        },
        'click .locality__item a': function(e){
            //locality change
            this.changeLocality($(e.currentTarget));
            return false;
        },
        'click .activity__title' : function(e) {
            this.toggleBlocks($(e.currentTarget));
        }
    },
    services: {},
    categories: {},
    localStorage: false,
    initialize: function(){
        var savedGraph, savedActivities, param, paramG;
       if (!this.model.models[0].get('fromUrl')) {
           if (starindex.localStorage) {
               if (localStorage.getItem('activeItems') != null) {
                   _.each(this.model.where({active: true}), function(item){
                       item.set({active: false}, {silent: true});
                   });
                   _.each(this.model.where({onGraph: true}), function(item){
                       item.set({onGraph: false}, {silent: true});
                   });

                   savedActivities = localStorage.getItem('activeItems').split(',');

                   savedGraph = localStorage.getItem('graphElems').split(',');
                   for (var i = 0; i < savedActivities.length; i++) {
                       param = savedActivities[i].split('|');
                       _.each(this.model.where({activityId: param[0], serviceId: param[1]}), function(item){
                          item.set({active: true}, {silence: true});
                      });
                   }
                   for (var i = 0; i < savedGraph.length; i++) {
                       paramG = savedGraph[i].split('|');
                      _.each(this.model.where({activityId: paramG[0], serviceId: paramG[1]}), function(item){
                         item.set({onGraph: true}, {silence: true});
                     });
                   }
                   starindex.currentPeriod = parseInt(localStorage.getItem('currentPeriod'));
                   $('#periods').find('input[value=' + parseInt(localStorage.getItem('currentPeriod')) + ']').prop('checked', true);
               }
           }
       }

        var me = this,
            counter = 0;
        if (this.model.models.length == 0) {
            this.$el.hide();
            $('#statInfoError').show();
            $('#activity-table-container').hide();
            $('#period-choose').hide();
            return false;
        }
        _.each(this.model.models, function(item){
           item.set({_time: new Date()});
           var currentCategory = item.get('category');
           if (!(currentCategory in me.categories)) {
               counter++;
               me.categories[currentCategory] = (counter == 1) ? 1 : 0;
           }
           if (item.get('label').indexOf('.')!= -1) {
               item.set('label', item.get('label').replace(/\./, '_'));
           }
            if (item.get('label').indexOf(' ')!= -1) {
               item.set('label', item.get('label').replace(/\s/, '_'));
            }
           if (item.get('label').indexOf('(')!= -1 || item.get('label').indexOf(')')!= -1) {
                item.set('label', item.get('label').replace(/\(/, ''));
                item.set('label', item.get('label').replace(/\)/, ''));
           }
        });
        this.model.bind('change:active', this.changeActivity, this);
        this.render();
        $(window).bind('detailsSave', _.bind(this.saveUserChoose, this));
        if (starindex.localStorage) {
            this.saveUserChoose();
        }

    },
    chooseOneItem: function(elem){
        var that = elem;
        var s = this.model.where({label: that.attr('rel')});
        s.forEach(function(item, index){
            item.set({active: !item.get('active'), _time: new Date()});
        });
    },
    chooseGroup: function(elem){
        var me = this;
        var text = elem.text();
        var trigger = elem;
        elem.text(elem.attr('rel'));
        elem.attr('rel', text);
        elem.toggleClass('selected-trigger');
        elem.parent().find('li').each(function(){
            var that = $(this);
            var s = me.model.filter(function(item){
                return (item.get('label') == that.attr('rel'))
            });
            s.forEach(function(item, index){
                item.set({active: trigger.hasClass('selected-trigger'), _time: new Date()}, {silent: true});

            });
        });
        me.model.trigger('change:active');
        return false;
    },
    changeActivity: function(){
        var me = this;
        var lArray = [];
        this.model.forEach(function(item, index){
            var li = me.$el.find("li[rel='" + item.get("label") + "']");
            if(item.get('active')) {
                li.addClass('selected');
            } else {
                li.removeClass('selected');
            }
        });
        this.$el.find('.activity-content').each(function(){
            var trigger = $(this).find('.activity-trigger');
            //change selected group
            if (trigger.hasClass('selected-trigger')&&!$(this).find('.activity-list').find('.selected').length) {
                var text = trigger.text();
                trigger.text(trigger.attr('rel'));
                trigger.attr('rel', text);
                trigger.toggleClass('selected-trigger');
            }
        });
        if (starindex.localStorage) {
            $(window).trigger('detailsSave');
        }
    },
    chooseActivity: function(elem){
        var that = elem;
        var me = this;
        var s = me.model.filter(function(item){
            return (item.get('label') == that.attr('rel'))
        });
        s.forEach(function(item, index){
            item.set({active: !item.get('active')});
        });
    },
    highlightItem: function(element, flag){
        element.toggleClass('selected', !flag);
    },
    changeLocality: function(elem){
        var me = this;
        me.model.locality = parseInt(elem.attr('rel'));
        me.$el.find('.locality__item-selected').removeClass('locality__item-selected');
        elem.parent().addClass('locality__item-selected');
        me.render();
    },
    render: function(){
        var me = this;
        var activities = '',
            CategoryItem = '',
            counter = 0, par;
        this.delegateEvents();
        if ($('.activity__item').length) {
            $('.activity__item').remove();
        }

        for (var i in me.categories) {
            par = {category: i, locality: this.model.locality};
            _.each(this.model.where(par), function(cat) {
                var selected = (cat.get('active') == true) ? ' class="selected"' : '';
                activities += '<li' + selected + ' rel="'+ cat.get('label')  + '">' + ' ' + cat.get('name') +'</li>';
                var variables = { category_title: cat.get('category'), activity_list: activities, category_title_eng: cat.get('category') };
                CategoryItem = _.template( $("#activity-list").html(), variables );
            });
            me.$el.append(CategoryItem);
            CategoryItem = '';
            activities = '';
        }
        $('#activities .activity__item').first().addClass('activity__item-opened');
    },
    toggleBlocks: function(elem){
        var li = this.$el.find('.activity__title').not(elem);
        li.parent().removeClass('activity__item-opened');
        for (var i in this.categories) {
            this.categories[i] = 0;
        }
        elem.parent().addClass('activity__item-opened');
        this.categories[elem.text()] = (elem.parent().hasClass('activity__item-opened')) ? 1 : 0;
    },
    saveUserChoose: function() {
        if (starindex.localStorage) {
            var lArray = [], gArray = [];
            _.each(this.model.where({active: true}), function(item){
                lArray.push(item.get('activityId')+ '|' + item.get('serviceId'));
            });
            _.each(this.model.where({onGraph: true}), function(item){
                gArray.push(item.get('activityId')+ '|' + item.get('serviceId'));
            });
            localStorage.setItem('activeItems', lArray);
            localStorage.setItem('graphElems', gArray);
            localStorage.setItem('currentPeriod', starindex.currentPeriod);
        }
    }
});

var activitieslist = new starindex.activitiesList({
    model: starindex.statisticsmodel,
    el: $('#activities')
});
