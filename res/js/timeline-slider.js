

;(function(win, $) {
	'use strict'

	var OPTIONS = {

		// 拆分panel差值
		panelDiffNum: 1,

		// 是否显示所有events
		showAllEvents: true,

		// 检测resize
		checkResize: false,

		// 左右切换时是否按panel切换
		navPanel: false,

		// 构建单个项内容
		buildItemContent: function(evt, index) {
			return evt.id;
		}

	};

	// 是否正在处理点击prevBtn
	var navPreving = false;

	var updatePosTimeout;

	/**
	 * TimelineSlider类
	 * @param {String|Object} ele      jquery选择器或者jquery对象
	 * @param {Object}        timeline Timeline实例
	 * @param {Object}        options  配置项
	 */
	function TimelineSlider(ele, timeline, options) {
		this.ele = $(ele);
		this.timeline = timeline;
		this.options = $.extend({}, OPTIONS, options);
		this.EVENT = $({});

		this.inited = false;

		this.x = 0;
		this.curIndex = -1;
		this.focusEle = null;
		this.resetIndex = 0;
		this.checkingDate = false;

		var init = $.proxy(this.init, this);
		if (timeline.inited) {
			setTimeout(init);
		} else {
			timeline.on('inited', init);
		}
	}
	win.TimelineSlider = TimelineSlider;

	$.extend(TimelineSlider.prototype, {

		/**
		 * 初始化工作
		 */
		init: function() {
			// 构建基本结构
			this._initContainer();
			this._initBody();
			this._initItemsContainer();
			this._initCursor();
			this._initNavBtn();
			
			this._body.append(this._cursor).append(this._itemsContainer);

			// 先隐藏
			this.hideContainer();
			this._container.append(this._body)
										 .append(this._nextNavBtn)
										 .append(this._prevNavBtn);
			this.ele.append(this._container);

			// 计算初始宽
			this._bodyWidth = this._body.width();
			this._baseX = this._bodyWidth / 2;

			// 刷新 填充内容
			this.refresh();

			// 绑定事件
			this._bindEvents();

			// 已经初始化了
			this.inited = true;
		},

		/**
		 * 显示元素
		 */
		showContainer: function() {
			this.ele.css('visibility', 'visible');
		},

		/**
		 * 隐藏元素
		 */
		hideContainer: function() {
			this.ele.css('visibility', 'hidden');
		},

		/**
		 * 刷新 更新内容
		 */
		refresh: function() {
			this.events = this.options.showAllEvents ? this.timeline.sourceData.events.concat() : this.timeline.getShowedEvents();
			this._itemsContainer.html(this._buildPanels());

			var panels = this._itemsContainer.find('.tls-item-panel');
			this._itemsContainer.width(panels.allWidth(true) + 500);
		},

		/**
		 * 初始化container
		 */
		_initContainer: function() {
			this._container = $('<div class="tls-container"></div>');
		},

		/**
		 * 初始化body
		 */
		_initBody: function() {
			this._body = $('<div class="tls-body"></div>');
		},

		/**
		 * 初始化itemsContainer
		 */
		_initItemsContainer: function() {
			this._itemsContainer = $('<div class="tls-items-container"></div>');
		},

		/**
		 * 创建timelineSlider的cursor
		 */
		_initCursor: function() {
			//this._cursor = $('<div class="tls-cursor"></div>');
		},

		/**
		 * 初始化navBtns
		 */
		_initNavBtn: function() {
			/*this._nextNavBtn = $('<div class="tls-nav-next"></div>');
			this._prevNavBtn = $('<div class="tls-nav-prev"></div>');*/
		},

		/**
		 * 构建panel
		 * @return {String} 字符串结果
		 */
		_buildPanels: function() {
			var that = this;
			var panelDiffNum = this.options.panelDiffNum;
			var reverseDate = this.timeline.options.reverseDate;
			var ret = '';
			var enddiv = '</div>';
			var lastPanel = '';
			var lastPid;
			if (reverseDate) {
				this.events.reverse();
			}
			var len = this.events.length;
			$.each(this.events, function (index, evt) {
				var pid = that._getPid(index, panelDiffNum);
				if (pid !== lastPid) {
					// 创建新的panel
					lastPid = pid;
					if (ret) {
						// 添加闭合div
						ret += enddiv;
					}
					lastPanel = that._buildPanel(pid, index);
					ret += lastPanel;
				}
				// 构建每一项内容
				var oIndex = reverseDate ? len - index - 1 : index;
				ret += that._buildItem(oIndex, index - pid * panelDiffNum, that.options.buildItemContent.call(that, evt, oIndex));
			});
			ret += enddiv;
			return ret;
		},

		/**
		 * 得到panel的id
		 * @param  {Number} index        次序
		 * @param  {Number} panelDiffNum 拆分panel差值
		 * @return {Number}              panel的id
		 */
		_getPid: function(index, panelDiffNum) {
			if (!panelDiffNum) panelDiffNum = this.options.panelDiffNum;
			return Math.floor(index / panelDiffNum);
		},

		/**
		 * 构建panel主体
		 * @param  {Number} id         panel的id
		 * @param  {Number} startIndex 开始index
		 * @return {String}            构建结果字符串
		 */
		_buildPanel: function(id, startIndex) {
			return '<div class="tls-item-panel" id="tls-panel-' + id + '" data-start-index="' + startIndex + '">';
		},

		/**
		 * 构建panel主体
		 * @param  {Number} index   在events中次序
		 * @param  {Number} rindex  相对当前panel的次序
		 * @param  {String} content 内容
		 * @return {String}         构建结果字符串
		 */
		_buildItem: function(index, rindex, content) {
			//var cls = 'tls-item-' + (rindex + 1);
			return '<div class="tls-item" data-index="' + index + '">' + content + '</div>';
		},

		/**
		 * 显示隐藏navBtn
		 */
		_checkNav: function() {
			var halfRange = this._getNavRange() / 2;
			var len = this.events.length - 1;
			this._nextNavBtn[
				(this.curIndex < len) && (this.curIndex + halfRange < len) ?
					'show' :
					'hide'
			]();
			this._prevNavBtn[
				(this.curIndex > 0) && (this.curIndex - halfRange > 0) ?
					'show' :
					'hide'
			]();
		},

		/**
		 * 检测日期，更新timeline
		 */
		_checkCurDate: function() {
			var evt = this.events[this.curIndex];
			var timeline = this.timeline;
			var _date = timeline.getValidDate(Timeline.parseDateByLevel(evt[timeline.options.reverseDate ? 'endDate' : 'startDate'], timeline.getDateLevel()));
			// 如果当前日期和focusDate不相等
			if (!timeline.equalByLevel(_date)) {
				timeline.moveTo(_date);
			}
		},

		/**
		 * 绑定一些基础事件
		 */
		_bindEvents: function() {
			var that = this;
			var evtName = 'refresh';
			if (!this.options.showAllEvents) evtName = '_refresh';
			this.timeline.on(evtName, function(e) {
				that.inited && that.refresh();
			});
			this.timeline.on('focusValidDateChange', function(e, date, moving) {
				that.moveTo(date, moving);
			});

			this.options.checkResize && $(window).on('resize', (this._onResizeHandler = $.proxy(this._onResize, this)));

			this._container.delegate('.tls-nav-next', 'click', (this._onNavNextHandler = $.proxy(this._onNavNext, this)));
			this._container.delegate('.tls-nav-prev', 'click', (this._onNavPrevHandler = $.proxy(this._onNavPrev, this)));
		},

		/**
		 * 得到切换差值
		 * @return {Number} 差值
		 */
		_getNavRange: function() {
			if (this.options.navPanel) return this.options.panelDiffNum;
			return 1;
		},

		/**
		 * 下一个导航按钮点击处理函数
		 */
		_onNavNext: function() {
			this.checkingDate = true;
			this._setFocus(this.curIndex + this._getNavRange());
			this.checkingDate = false;
		},

		/**
		 * 上一个导航按钮点击处理函数
		 */
		_onNavPrev: function() {
			navPreving = true;
			this.checkingDate = true;
			var range = this._getNavRange();
			var panelDiffNum = this.options.panelDiffNum;
			if (this.options.navPanel && panelDiffNum > 1) {
				var r = (this.curIndex - this.resetIndex) % panelDiffNum;
				if (r > 0) {
					range = r;
				}
			}
			this._setFocus(this.curIndex - range);
			navPreving = false;
			this.checkingDate = false;
		},

		/**
		 * resize处理函数
		 */
		_onResize: function() {
			clearTimeout(this._resizeTimeout);
			var that = this;
			this._resizeTimeout = setTimeout(function() {
				that._bodyWidth = that._body.width();
				that._baseX = that._bodyWidth / 2;
				that._doUpdatePos(that.focusEle.offset().left + that.focusEle.outerWidth() / 2);
			}, 100);
		},

		/**
		 * 移动到指定日期
		 * @param  {Date} date   指定日期
		 * @param  {Boolean} moving 是否在mousemove中
		 */
		moveTo: function(date, moving) {
			if (this.checkingDate) return;
			var that = this;
			var timeline = this.timeline;
			var reverseDate = timeline.options.reverseDate;
			var focusEle = that.focusEle;
			var oriDate = date;
			if (!reverseDate && navPreving) date = timeline.getNextDate(date);
			if (reverseDate && focusEle && !navPreving) date = timeline.getPrevDate(date);
			$.each(this.events, function(index, evt) {
				var _date = timeline.getValidDate(
					Timeline.parseDateByLevel(
						evt['endDate'], 'MSSECONDS'
					)
				);
				var _date2 = timeline.getValidDate(
					Timeline.parseDateByLevel(
						evt['startDate'], 'MSSECONDS'
					)
				);
				var c = reverseDate ?
									focusEle ?
										(_date - date < 0) || (_date2 - date < 0) ?
											true :
											false :
										(_date - date <= 0) || (_date2 - date <= 0) ?
												true :
												false :
									(_date - date >= 0) || (_date2 - date >= 0) ?
										true :
										false;
				if (c) {
					that._setFocus(navPreving ? index - 1 : index, moving);
					return false;
				}
			});
		},

		/**
		 * 设置焦点相关
		 * @param {Number}  index     当前次序
		 * @param {Boolean} moving    是否在mousemove中
		 */
		_setFocus: function(index, moving) {
			if (index < 0) index = 0;
			if (index >= this.events.length) index = this.events.length - 1;
			if (index === this.curIndex) return;
			if (!this.checkingDate) this.resetIndex = index;
			this.focusEle = this._getEle(index);
			this.curIndex = index;
			this._doUpdatePos(this.focusEle.offset().left + this.focusEle.outerWidth() / 2, moving);
			//this._checkNav();
			this.checkingDate && this._checkCurDate();
		},

		/**
		 * 根据index得到元素
		 * @param  {Number} index 当前次序
		 * @return {Object}       jquery包装过元素对象
		 */
		_getEle: function(index) {
			var nIndex = index;
			if (this.timeline.options.reverseDate) nIndex = this.events.length - index - 1;
			return $('#tls-panel-' + this._getPid(index)).find('.tls-item[data-index="' + nIndex + '"]');
		},

		/**
		 * 更新位置
		 * @param  {Number}  offsetX  offset差值
		 * @param  {Boolean} moving   是否在mousemove中
		 */
		_doUpdatePos: function(offsetX, moving) {
			var that = this;
			var offset;
			var x;
			if (typeof that._itemsContainerOffset == 'undefined') {
				// 初始第一次
				offset = that._itemsContainer.offset();
				x = that.x = offset.left - offsetX  + that._baseX;
				that.trigger('startMoving', that);
				that._itemsContainer.css('left', x);
				that._itemsContainerOffset = that._itemsContainer.offset();
				// 此时显示元素
				that.showContainer();
				that.trigger('finishMoving', that);
				return;
			}
			if (!moving) {
				doMove();
				return;
			}
			// 针对于正在mousemove中 比较快
			// 还需要有动画效果 所以需要
			// 加上延迟处理
			var duration = 250;
			clearTimeout(updatePosTimeout);
			updatePosTimeout = setTimeout(doMove, duration);

			function doMove(x) {
				that.trigger('startMoving', that);
				offset = that._itemsContainerOffset;
				x = that.x = offset.left - offsetX + that._baseX;
				that._itemsContainer.animate({
					left: x
				}, {
					duration: duration,
					queue : false,
					complete: function() {
						that._itemsContainerOffset = that._itemsContainer.offset();
						that.trigger('finishMoving', that);
					}
				});
			}
		},

		/**
		 * 销毁
		 */
		destroy: function() {
			this.off('startMoving');
			this.off('finishMoving');
			this._onResizeHandler && $(window).off('resize', this._onResizeHandler);
			this._container.off('click', this._onNavNextHandler);
			this._container.off('click', this._onNavPrevHandler);
			this._onResizeHandler = null;
			this._onNavNextHandler = null;
			this._onNavPrevHandler = null;
			this._container.remove();
			
			this._container = null;
			this._body = null;
			this._itemsContainer = null;
			this.ele = null;
			this.timeline = null;
			this.options = null;
			this.EVENT = null;
			this.inited = false;
			this.focusEle = null;
		}

	});

	function afterGetTimeline() {
		if (!Timeline || Timeline.id !== 'Timeline') {
			throw new Error('Timeline is error.');
		}
		// 拓展事件相关
		if (TimelineSlider.prototype.on && TimelineSlider.prototype.off) {
			return;
		}
		$.each(['on', 'off', 'trigger'], function(_, name) {
			TimelineSlider.prototype[name] = function() {
				return Timeline.prototype[name].apply(this, arguments);
			};
		});
	}

	// 支持MD
	if (typeof module === 'object' && module && typeof module.exports === 'object') {
		require('./timline');
		afterGetTimeline();
		module.exports = TimelineSlider;
	} else {
		if (typeof define === 'function' && define.amd) {
			define(['./timeline'], function() {
				afterGetTimeline();
				return TimelineSlider;
			});
		} else {
			afterGetTimeline();
		}
	}

}(window, jQuery));