const Layout = require('./model/layout');
const utils = require('../utils/utils');

/**
 * Layout Manager(Layout을 관리한다)
 */
var layoutManager = {
    contentLayout: null, //all layout
    selectedLayout: null, //selected layout
    eventInfo: null, //event information
    idIdx: 1, //layout id index

    /**
     * Find layout that has same id(id에 해당하는 layout을 return)
     * @param {string} layoutId 
     * @param {Layout} layout 
     */
    selectLayout: function (layoutId, layout) {
        try {
            var selectedLayout = null;

            if (layoutId == layout.info.layoutId) {
                return layout;
            } else {
                for (var i = 0, len = layout.child.length; i < len; i++) {
                    if (selectedLayout = layoutManager.selectLayout(layoutId, layout.child[i])) {
                        return selectedLayout;
                    }
                }

                return null;
            }
        } catch (err) {
            console.log(err.message);
        }
    },

    /**
     * Update layout - Width, Height, X, Y, Etc...
        (
            1. Parent layout 입력 받아서 모든 Child의 layout을 재조정
            2. 기존 작성된 HTML Import 고려 필요
            3. offsetLeft offsetTop은 자기자신의 부모 위치를 시작점으로 정함
                - margin
                - padding
            4. resizing 될때 update 필요
        )
     * @param {Layout} layout 
     */
    updateLayout: function (layout) {
        try {
            if (layout) {
                var child = layout.dom;
                var childRect = child.getBoundingClientRect();
                var style = window.getComputedStyle(child); //CSS 속성까지 적용 된다.
                var parentLayout, parentStyle, posParent = child.parentElement;

                while (posParent) {
                    parentStyle = window.getComputedStyle(posParent);
                    if (parentStyle.position === 'relative' || parentStyle.position === 'absolute') {
                        break;
                    }

                    posParent = posParent.parentElement;
                }

                if (posParent) {
                    parentLayout = layoutManager.selectLayout(posParent.getAttribute('hb_layout_id'), layoutManager.contentLayout);
                    layout.pos.x = (child.offsetLeft ? (child.offsetLeft + parentLayout.pos.x) : parentLayout.pos.x);
                    layout.pos.y = (child.offsetTop ? (child.offsetTop + parentLayout.pos.y) : parentLayout.pos.y);
                    layout.pos.width = (child.scrollWidth ? child.scrollWidth : childRect.width);
                    layout.pos.height = (child.scrollHeight ? child.scrollHeight : childRect.height);
                } else {
                    layout.pos.x = (child.offsetLeft ? child.offsetLeft : childRect.left);
                    layout.pos.y = (child.offsetTop ? child.offsetTop : childRect.top);
                    layout.pos.width = (child.scrollWidth ? child.scrollWidth : childRect.width);
                    layout.pos.height = (child.scrollHeight ? child.scrollHeight : childRect.height);
                }

                for (var i = 0, len = layout.child.length; i < len; i++) {
                    layoutManager.updateLayout(layout.child[i]);
                }
            }
        } catch (err) {
            console.log(err.message);
        }
    },

    /**
     * Add child layout to parent layout (parent layout에 child layout 추가)
     * @param {Layout} parent 
     * @param {Layout} child 
     * @param {number} position 
     */
    addLayout: function (parent, child, position) {
        var parentLayout, childLayout;

        if (typeof parent === 'string') {
            parentLayout = layoutManager.selectLayout(parent, layoutManager.contentLayout);
        } else {
            parentLayout = parent;
        }

        if (typeof child === 'string') {
            childLayout = layoutManager.selectLayout(child, layoutManager.contentLayout);
        } else {
            childLayout = child;
        }

        childLayout.info.parentLayoutId = parentLayout.info.layoutId;

        parentLayout.child.splice(position, 0, childLayout);
    },

    /**
     * Delete child layout in parent layout
     * @param {string, Layout} parent 
     * @param {string, Layout} child 
     */
    deleteLayout: function (parent, child) {
        var parentLayout, childLayout;

        if (typeof parent === 'string') {
            parentLayout = layoutManager.selectLayout(parent, layoutManager.contentLayout);
        } else {
            parentLayout = parent;
        }

        if (typeof child === 'string') {
            childLayout = layoutManager.selectLayout(child, layoutManager.contentLayout);
        } else {
            childLayout = child;
        }

        for (var i = 0, len = parentLayout.child.length; i < len; i++) {
            if (parentLayout.child[i].info.layoutId == childLayout.info.layoutId) {
                parentLayout.child.splice(i, 1);
                break;
            }
        }
    },

    /**
     * init css
     * @param {Layout} layout 
     */
    initCss: function (layout) {
        try {
            layout.initCss();

            for (var i = 0, len = layout.child.length; i < len; i++) {
                layoutManager.initCss(layout.child[i]);
            }
        } catch (err) {
            console.log(err.message);
        }
    },

    /**
     * Check contain Block
     * 1. block 포함 확인
     * 2. Tree 구조 사용
     *      - parent에 속하지 않을 시 parent의 child 쪽은 확인 필요 없음
     * 3. 중위 순회 
     * @param {number} x 
     * @param {number} y 
     * @param {Layout} layout 
     */
    containBlock: function (x, y, layout) {
        try {
            if (layoutManager.selectedLayout &&
                layoutManager.selectedLayout.info.layoutId == layout.info.layoutId) {
                return null;
            }

            var containLayout = null;
            if (layout.contain(x, y)) {
                containLayout = layout;

                if (layout.child.length == 0) {
                    return containLayout;
                }

                var childLayout = null;
                for (var i = 0, len = layout.child.length; i < len; i++) {
                    childLayout = layoutManager.containBlock(x, y, layout.child[i]);
                    if (childLayout) {
                        containLayout = childLayout;
                        break;
                    }
                }
            }

            return containLayout;
        } catch (err) {
            console.log(err.message);
        }
    },

    /**
     * move layout
     * @param {event} e 
     */
    moveLayout: function (e, option = null) {
        try {
            layoutManager.initCss(layoutManager.contentLayout);

            if (e.clientX == 0 && e.clientY == 0) {
                return;
            }

            var body = layoutManager.contentLayout.dom,
                x = e.clientX + body.scrollLeft,
                y = e.clientY + body.scrollTop,
                parentLayout = layoutManager.containBlock(x, y, layoutManager.contentLayout);

            if (parentLayout) {
                layoutManager.eventInfo = {
                    parentLayout: parentLayout,
                    selectedLayout: (layoutManager.selectedLayout ? layoutManager.selectedLayout : null),
                    posIdx: 0,
                    layoutOption: option
                };

                var parent = parentLayout.dom;
                parent.classList.add('hb_border-contain');

                if (parentLayout.child.length > 0) {
                    var nearLayout, layoutPos = 0, minDistance = Infinity, distance = 0;
                    for (var i = 0, len = parentLayout.child.length; i < len; i++) {
                        distance = Math.sqrt(
                            Math.pow(x - (parentLayout.child[i].pos.x + parentLayout.child[i].pos.width * 0.5), 2) +
                            Math.pow(y - (parentLayout.child[i].pos.y + parentLayout.child[i].pos.height * 0.5), 2)
                        );

                        if (minDistance > distance) {
                            minDistance = distance;
                            nearLayout = parentLayout.child[i];
                            layoutPos = i;
                        }
                    }

                    var child = nearLayout.dom;
                    if (nearLayout.y < y && (nearLayout.pos.y + nearLayout.pos.height) > y) {
                        if (nearLayout.pos.x > x) {
                            child.classList.add('hb_border-left-move');
                            layoutManager.eventInfo.posIdx = ((layoutPos - 1) < 0) ? 0 : layoutPos;
                        } else {
                            child.classList.add('hb_border-right-move');
                            layoutManager.eventInfo.posIdx = layoutPos + 1;
                        }
                    } else {
                        if (nearLayout.pos.y > y) {
                            child.classList.add('hb_border-top-move');
                            layoutManager.eventInfo.posIdx = ((layoutPos - 1) < 0) ? 0 : layoutPos;
                        } else {
                            child.classList.add('hb_border-bottom-move');
                            layoutManager.eventInfo.posIdx = layoutPos + 1;
                        }
                    }
                } else {
                    parent.classList.add('hb_border-top-contain');
                }
            } else {
                layoutManager.eventInfo = null;
            }
        } catch (err) {
            console.log(err.message);
        }
    },

    /**
     * set new layout
     * 1. new layout 이동 완료
     * 2. new layout 추가 및 업데이트
     * @param {event} e 
     */
    setNewLayout: function (e) {
        try {
            layoutManager.initCss(layoutManager.contentLayout);

            if (layoutManager.eventInfo) {
                var parentLayout = layoutManager.eventInfo.parentLayout;
                var parent = parentLayout.dom;

                var blockOption = layoutManager.eventInfo.option;
                var newChildId = blockOption.element + '_' + layoutManager.idIdx;

                var newChildLayout = new Layout();
                newChildLayout.info = {
                    layoutId: newChildId,
                    parentLayoutId: parentLayout.info.id,
                    elementType: option.element
                };

                var _newChild = {
                    element: blockOption.element,
                    event: U.blockDefaultEvents
                };
                _newChild.attr = {};
                for (var attrName in blockOption.attrs) {
                    _newChild.attr[attrName] = blockOption.attrs[attrName];
                }
                _newChild.text = (blockOption.text ? blockOption.text : null);
                var newChild = utils.builder(_newChild);
                newChildLayout.dom = newChild;

                //posIdx
                if (parentLayout.child[layoutManager.eventInfo.posIdx]) {
                    parent.insertBefore(newChild, parent.children[layoutManager.eventInfo.posIdx]);
                } else {
                    parent.appendChild(newChild);
                }

                layoutManager.addLayout(parentLayout, newChildLayout, layoutManager.eventInfo.posIdx);

                layoutManager.idIdx++;

                layoutManager.updateLayout(layoutManager.contentLayout);
            }
        } catch (err) {
            console.log(err.message);
        }
    },

    /**
     * set layout
     * 1. layout 이동 완료
     * 2. layout 업데이트
     * @param {event} e 
     */
    setLayout: function (e) {
        try {
            layoutManager.initCss(layoutManager.contentLayout);

            if (layoutManager.eventInfo) {
                var eventInfo = layoutManager.eventInfo;
                var parentLayout = eventInfo.parentLayout;
                var parent = parentLayout.dom;

                layoutManager.deleteLayout(eventInfo.selectedLayout.info.parentLayoutId, eventInfo.selectedLayout);
                layoutManager.addLayout(parentLayout, eventInfo.selectedLayout, eventInfo.posIdx);

                var selectedDom = eventInfo.selectedLayout.dom;

                if (parentLayout.child[eventInfo.posIdx]) {
                    parent.insertBefore(selectedDom, parent.children[eventInfo.posIdx]);
                } else {
                    parent.appendChild(selectedDom);
                }

                selectedDom.classList.remove('hb_selected');
                selectedDom.removeAttribute('draggable');
                layoutManager.selectedLayout = null;

                layoutManager.updateLayout(layoutManager.contentLayout);
            }
        } catch (err) {
            console.log(err.message);
        }
    },

    /**
     * layout selectable
     * @param {event} e 
     */
    selectableLayout: function (e) {
        try {
            if (e.type === 'mouseover') {
                e.target.classList.add('hb_selectable');
            } else if (e.type === 'mouseout') {
                e.target.classList.remove('hb_selectable');
            }
        } catch (err) {
            console.log(err.message);
        }
    },

    /**
     * select layout
     * @param {event} e 
     */
    selectLayout: function (e, info) {
        try {
            if (layoutManager.selectedLayout) {
                var selectedDom = layoutManager.selectedLayout.dom;
                selectedDom.classList.remove('hb_selected');
                selectedDom.removeAttribute('draggable');

                //해결할 수 있는 방법은?
                if (selectedDom === e.target) {
                    layoutManager.selectedLayout = null;
                    //U.draggableMenuBlock(true);
                    return;

                } else {
                    selectedDom.classList.remove('hb_selectable');
                }
            }

            layoutManager.selectedLayout = layoutManager.selectLayout(info.id, layoutManager.contentLayout);
            e.target.setAttribute('draggable', 'true');
            e.target.classList.add('hb_selected');
            e.target.classList.add('hb_selectable');

            //U.draggableMenuBlock(false);
        } catch (err) {
            console.log(err.message);
        }
    }
};