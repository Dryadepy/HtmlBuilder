const CSS = require('../config/css');

var propertyStyle2Save = {
  setProperty: function (prop) {
    this.prop = {};

    this.prop.name = prop.name;
    this.prop.title = prop.title;
    this.prop.attr_type = prop.attr_type;
    this.prop.category = prop.category;
  },

  setDom: function (dom) {
    this.dom = dom;
  },

  setSelected: function (selected) {
    this.selected = selected;
  },

  callback: function (callback) {
    this.callback = callback;
  },

  event: {
    type: 'click',
    func: function (e) {
      if (propertyStyle2Save.selected) {
        var eventDom = e.target.previousSibling;

        //U.style2Css 수정 필요 -- selected를 인식하지 못하는 상태
        /*
        if(U.style2Css(eventDom.value)) {
          propertyStyle2Save.selected.setAttribute('style', '');
          var classText = propertyStyle2Save.selected.getAttribute('class');
          propertyStyle2Save.selected.setAttribute('class', classText + ' ' + value);
        }
        */

        if (propertyStyle2Save.callback && typeof propertyStyle2Save.callback === 'function') {
          propertyStyle2Save.callback();
        }
      }
    }
  },

  render: function () {
    var event = this.event;
    var prop = this.prop;

    return {
      element: 'div',
      attr: {
        class: CSS.prop_body_div
      },
      child: [{ //div for title
          element: 'div',
          attr: {
            class: CSS.prop_body_title_div
          },
          child: [{
            element: 'label',
            attr: {
              class: CSS.prop_body_title_label
            },
            text: prop.title
          }]
        },

        { //div for property set
          element: 'div',
          attr: {
            class: CSS.prop_body_set_div
          },
          child: [{
              element: 'input',
              attr: {
                type: 'text',
                class: CSS.prop_body_set_text,
                hb_set_type: 'value'
              }
            },
            {
              element: 'button',
              attr: {
                class: CSS.hb_prop_body_set_btn
              },
              text: 'Save',
              event: [event]
            }
          ]
        }
      ]
    };
  }
};

module.exports = propertyStyle2Save;