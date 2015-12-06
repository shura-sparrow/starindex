starindex.activitiesDetails = Backbone.View.extend({
    tableFlag: false,
    maxOnGraph: 6,
    graphCounters: 0,
    showHead: true,
    events: {
        'click #period-popup .plain-button': 'changePeriod',
        'click #activity-rows tr': function(e) {
            this.onGraph($(e.currentTarget).attr('id'));
            return false;
        },
        'click #delete-all': function(e) {
            this.deleteAllRows();
        },
        'click #activity-rows .graph-delete': function(e) {
            this.deleteRow($(e.currentTarget));
            return false;
        },
        'mouseover .not-current': function(e) {
            var note = $('#note');
            if (!$('#note').length) {
                $('body').append('<div id="note" class="note-block"></div>');
            }
            note.text($(e.currentTarget).find('.key-nonactivity-icon').attr('title'));
            $(e.currentTarget).find('.key-nonactivity-icon').removeAttr('title');
            note.show().css({
                left: $(e.currentTarget).offset().left,
                top: $(e.currentTarget).offset().top - note.outerHeight() - 10
            });
        },
        'mouseout .not-current': function(e) {
            var note = $('#note');
            $(e.currentTarget).find('.key-nonactivity-icon').attr('title', note.text());
            note.empty().hide();
        },
        'mouseover .tooltip': function(e) {
            var note = $('#note');
            if (!note.length) {
                $('body').append('<div id="note" class="note-block"></div>');
            }
            note.text($(e.currentTarget).attr('title'));
            $(e.currentTarget).removeAttr('title');
            note.show().css({
                left: $(e.currentTarget).offset().left,
                top: $(e.currentTarget).offset().top - note.outerHeight() - 10
            });
        },
        'mouseout .tooltip': function(e) {
            var note = $('#note');
            $(e.currentTarget).attr('title', note.text());
            note.empty().hide();
        }

    },
    changedPeriod: true,
    changedModels: [],
    colors: [{
        color: "#5fb503",
        taken: false
    },
    {
        color: "#efcc26",
        taken: false
    },
    {
        color: "#FF6600",
        taken: false
    },
    {
        color: "#FF9E01",
        taken: false
    },
    {
        color: "#FF0000",
        taken: false
    },
    {
        color: "#B0DE09",
        taken: false
    },
    {
        color: "#FF0F00",
        taken: false
    }],
    initialize: function() {
        this.initializing = true;
        this.model.bind('change:active', this.getInfoDetails, this);
        this.changedPeriod = true;
        if (starindex.localStorage) {
            //если период есть в хранилище
            if (localStorage.currentPeriod != null) {
               starindex.currentPeriod = parseInt(localStorage.getItem('currentPeriod'));
               $('#periods').find('input[value=' + parseInt(localStorage.getItem('currentPeriod')) + ']').prop('checked', true);
            }
        }
        this.getInfoDetails();
    },
    render: function() {
        var me = this, itemsList,
            counterProperModel, length,
            lastDate, itemData, tableTemplate, item,firstDate,
            firstDateTable, firstDateWithYear, lastDateTable, lastDateTableWithYear;
            $activityTable = $('#activity-table-container');
        $activityTable.empty();
        if (this.model.where({active: true}).length) {
            if (this.showHead) {
				itemsList = this.model.where({active: true});
				/* выбираем запись с максимальным периодом */
				counterProperModel = 0, length = 1;
				for (var i in itemsList) {
					itemData = itemsList[i].get('data');
					if (itemsList[i].get('data').length > length) {
						length = itemData.length;
						counterProperModel = i;
					}
				}
                item = this.model.where({active: true})[counterProperModel];
                itemData = item.get('data');
                firstDate = itemData[0]['date'].split('-');
                /* first date in period */
                firstDateTable = parseInt(firstDate[2]) + ' ' + starindex.date.months[starindex.language][parseInt(firstDate[1]) - 1];
                firstDateWithYear = firstDateTable + ' ' + firstDate[0];

                lastDate = itemData[itemData.length - 1]['date'].split('-');
                /* last date in period */
                lastDateTable = parseInt(lastDate[2]) + ' ' + starindex.date.months[starindex.language][parseInt(lastDate[1]) - 1];
                lastDateTableWithYear = lastDateTable + ' ' + lastDate[0];
                tableTemplate = _.template( $("#activity-table").html(), {start_data: firstDateTable, end_data: lastDateTable});
                $activityTable.prepend(tableTemplate);
                me.$el.find('.actual-period').html(firstDateWithYear + ' &mdash; ' + lastDateTableWithYear);
            }
        }
        me.changedModels = _.sortBy(this.model.where({active: true}), function(item){
            return item.get('_time');
        });
        _.each(me.changedModels, function(item, index){
            if (item.get('active')) {
                var lastVal = item.get('data')[item.get('data').length - 1];
                var firstVal = item.get('data')[0];
                if (me.initializing) {
                    if (me.graphCounters >= me.maxOnGraph) {
                        item.set({onGraph: false});
                    }
                    if (item.get('onGraph'))
                        me.colorize(item, true);
                }
                var dynamics = ((firstVal['current'] == 'true') && (lastVal['current'] == 'true'));
                var tend = dynamics ? ((item.get('isRising') === 'true') ? 'increase' : 'decrease') : '';
                var rowTemplate = _.template($("#activity-row").html(),
                {
                    logo: item.get('logo'),
                    resource_name: item.get('name'),
                    row_name: item.get('label'),
                    value_first: numeral(item.get('data')[0]['value']).format('0.0a'),
                    value_last: numeral(item.get('data')[item.get('data').length - 1]['value']).format('0.0a'),
                    tend: tend,
                    is_first_current: (firstVal['current'] == 'true') ? '' : 'not-current',
                    is_last_current: (lastVal['current'] == 'true') ? '' : 'not-current',
                    background: item.get('onGraph') ? item.get('color') : '',
                    selected: item.get('onGraph') ? 'selected' : '',
                    dynamics: dynamics ? numeral(item.get('dynamics')).format('0.0a') : ' &mdash; ',
                    dynamicsC: dynamics ? item.get('dynamicsC') + '%' : ' &mdash; ',
                    img_title: item.get('title'),
                    showIcon: (item.get('title') == '') ? 'none' : 'block'
                });
                $('#activity-rows').prepend(rowTemplate);

            } else {
                $('#'+item.get('label')).remove();
                if (!me.model.where({active: true}).length) {
                    $('#activity-table-container').find('thead').remove();
                    me.showHead = true;
                }
            }
        });

        me.initializing = false;
        this.delegateEvents();
    },
    changePeriod: function() {
        starindex.currentPeriod = parseInt($('#periods').find('input:checked').val());
        starindex.periods.instance().hide();
        this.changedPeriod = true;
        $(window).trigger('detailsSave');
        this.model.trigger('change:active');
        $('#period-choose').addClass('waiting');
    },
    getInfoDetails: function(){
        var $period = $('#period-choose'),
            me = this,
            activity = '',  service = '', labels = '', artistId = 1, model;
        if (this.model.length == 0) {
            $('#statDetailsError').show();
            $('#statDetailsError2').show();
            return false;
        }
        $period.addClass('waiting');
        me.changedModels = [];
        this.model.forEach(function(item, index){
            if (item.get('active')) {
                activity += item.get('activityId') + ',';
                service += item.get('serviceId') + ',';
                labels += item.get('label') + ',';
                me.changedModels.push(item);
            }
        });
        activity = activity.substr(0, activity.length - 1);
        service = service.substr(0, service.length - 1);
        labels = labels.substr(0, labels.length - 1);
        artistId = $('#artist-details-outer').attr('data') || 1;

        if (activity.length > 0) {

        $.get('/' + starindex.language + '/artist/' + artistId + '/getstatistic',
            {
                activityId: activity,
                serviceId: service,
                interval: starindex.currentPeriod,
                labels: labels
            }, function(data){
                for (var i in data) {
                    model = me.model.where({label: data[i].label});
                    for (var j in data[i]) {
                        model[0].set(j, data[i][j]);
                    }
                }
                $('#period-choose').removeClass('waiting');
                me.render();
                me.model.trigger('change:onGraph');
        }, 'json').fail(function() {
            $period.removeClass('waiting');
        });

        } else {
            me.render();
            if (!this.model.where({onGraph: true}).length)
                this.graphCounters = 0;
            $period.removeClass('waiting');
        }
    },
    deleteRow: function(elem) {
        var parent = elem.parents('tr'),
            item = this.model.where({'label' : parent.attr('id')})[0],
            colorNum = 1;
        this.graphCounters--;

        item.set({active: false, onGraph: false });
        this.graphCounters = this.model.where({onGraph: true}).length;
        for (var i = 0; i < this.colors.length; i++) {
            if (this.colors[i].color == item.get('color')) {
                colorNum = i;
                break;
            }
        }

        item.set('color', '');
        this.colors[colorNum].taken = false;
        parent.remove();
        $(window).trigger('detailsSave');
        return false;
    },
    deleteAllRows: function() {
        var me = this;
        // select nonactive rows
        $('#activity-rows tr').each(function(){
            me.model.where({'label': $(this).attr('id')})[0].set({active: false, onGraph: false}, {silent: true});
            $(this).remove();
        });
        me.graphCounters = 0;
        for (var i = 0; i < this.colors.length; i++) {
            this.colors[i].taken = false;
        }
        this.model.trigger('change:active');
        // trigger saving
        $(window).trigger('detailsSave');
        return false;
    },
    onGraph: function(id) {
        var elem = $('#' + id).find('.graph-check'),
            me = this, colorNum;
        _.each(this.model.where({label: id}), function(item){
            //no more graphs
            if ((!item.get('onGraph')) && me.graphCounters >= me.maxOnGraph) {
                return false;
            }
            item.set({onGraph: !item.get('onGraph')}, {silent: true});
            if (item.get('onGraph')) {
                me.colorize(item, false);
            } else {
                me.graphCounters--;
                for (var i = 0; i < me.colors.length; i++) {
                    if (me.colors[i].color == item.get('color')) {
                        colorNum = i;
                        break;
                    }
                }
                me.colors[colorNum].taken = false;
                item.set('color', '');
                me.model.trigger('change:onGraph');
                elem.css({
                    background: 'transparent'
                }).removeClass('selected');

            }
        });
        // save details
        $(window).trigger('detailsSave');
    },
    colorize: function(item, silentFlag){
        var me = this, colorNum;
        if (me.graphCounters < me.maxOnGraph) {

            me.graphCounters++;
            colorNum = 0;
            for (var i = 0; i < me.colors.length; i++) {
                if (!me.colors[i].taken) {
                    colorNum = i;
                    break;
                }
            }
            item.set({color: me.colors[colorNum].color}, {silent: silentFlag});
            me.colors[colorNum].taken = true;
            if (!silentFlag)
                me.model.trigger('change:onGraph');
            $('#' + item.get('label')).find('.graph-check').css({
                background: me.colors[colorNum].color
            }).addClass('selected');
        }
    }
});
var activitiesdetails = new starindex.activitiesDetails({
    model: starindex.statisticsmodel,
    el: $('#statDetails')
});