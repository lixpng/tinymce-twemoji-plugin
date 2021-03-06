/* eslint-disable */
;(function (domGlobals) {
  'use strict'
  var TinymceResource = tinymce.util.Tools.resolve('tinymce.Resource')
  var TinymcePromise = tinymce.util.Tools.resolve('tinymce.util.Promise')
  var TinymceDelay = tinymce.util.Tools.resolve('tinymce.util.Delay')

  var DATA_BASE_FOLDER = '/js/twemoji-database.min.js'
  var IMG_FOLDER = '/assets/72x72'

  var CSSES = [
    '/assets/css/activity.min.css',
    '/assets/css/animals-nature.min.css',
    '/assets/css/flags.min.css',
    '/assets/css/food-drink.min.css',
    '/assets/css/objects.min.css',
    '/assets/css/smileys-people.min.css',
    '/assets/css/symbols.min.css',
    '/assets/css/travel-places.min.css',
  ]

  var patternInputName = 'pattern'
  var currentCategory = 'Smileys & People'

  function throttle(fn, wait) {
    var lastTime = Date.now()
    return function () {
      var nowTime = Date.now()
      if (nowTime - lastTime >= wait) {
        lastTime = nowTime
        return fn.apply(null, Array.prototype.slice.call(arguments))
      }
    }
  }

  function getEmojiImg(infoStr, pluginUrl) {
    var infoArr = infoStr.split(',')
    var codePoint = infoArr[0]
    var name = infoArr[1]
    var char = infoArr[2]
    var url = pluginUrl + IMG_FOLDER + '/' + codePoint + '.png'
    return (
      '<img style="width:20px;height:20px;vertical-align:middle;" draggable="false" title="' +
      name +
      '" alt="' +
      char +
      '" src="' +
      url +
      '"/>'
    )
  }

  function getEmojiBtn(infoStr) {
    var infoArr = infoStr.split(',')
    var codePoint = infoArr[0]
    var name = infoArr[1]
    var char = infoArr[2]
    return (
      '<div draggable="false" style="width:20px;height:20px;" id="twemoji-' +
      codePoint +
      '" title="' +
      name +
      '" alt="' +
      char +
      '"></div>'
    )
  }

  function insertEmoticon(editor, value, pluginUrl) {
    editor.insertContent(getEmojiImg(value, pluginUrl))
  }

  function getEmojisByCategory(categories, category) {
    category = category || currentCategory
    var category = categories.find(function (item) {
      return item.name === currentCategory
    })
    return category && category.emojis
  }

  function filterEmojis(emojis, pattern) {
    pattern = new RegExp(pattern, 'i')
    return emojis.filter(function (emoji) {
      return emoji.name.match(pattern)
    })
  }

  function initDatabase(editor, pluginUrl) {
    var state = {
      hasLoaded: false,
      categories: [],
    }
    var DEFAULT_ID = 'tinymce.plugins.twemoji'
    var DEFAULT_URL = pluginUrl + DATA_BASE_FOLDER
    var databaseId = editor.getParam(
      'twemoji_database_id',
      DEFAULT_ID,
      'string'
    )
    var databaseUrl = editor.getParam('twemoji_database_url', DEFAULT_URL)
    editor.on('init', function () {
      TinymceResource.load(databaseId, databaseUrl).then(
        function (categories) {
          state.categories = categories.map(function (category) {
            return Object.assign({}, category, {
              emojis: category.emojis.map(function (emoji) {
                var infoStr =
                  emoji.codePoint + ',' + emoji.name + ',' + emoji.char
                var icon = getEmojiBtn(infoStr, pluginUrl)
                return Object.assign({}, emoji, {
                  text: emoji.name,
                  icon: icon,
                  value: infoStr,
                })
              }),
            })
          })
          state.hasLoaded = true
        },
        function (err) {
          domGlobals.console.log('Failed to load twemoji: ' + err)
        }
      )
    })

    state.waitForLoad = function () {
      if (state.hasLoaded) {
        return TinymcePromise.resolve(true)
      } else {
        return new TinymcePromise(function (resolve, reject) {
          var numRetries = 15
          var interval = TinymceDelay.setInterval(function () {
            if (state.hasLoaded) {
              TinymceDelay.clearInterval(interval)
              resolve(true)
            } else {
              numRetries--
              if (numRetries < 0) {
                domGlobals.console.log(
                  'Could not load twemoji from url: ' + databaseUrl
                )
                TinymceDelay.clearInterval(interval)
                reject(false)
              }
            }
          }, 100)
        })
      }
    }

    return state
  }

  tinymce.PluginManager.add('twemoji', function (editor, pluginUrl) {
    CSSES.forEach(function (cssFolder) {
      tinymce.DOM.loadCSS(pluginUrl + cssFolder)
    })

    var database = initDatabase(editor, pluginUrl)

    var handleFilter = throttle(function (dialogApi) {
      var dialogData = dialogApi.getData()

      dialogApi.setData({
        results: filterEmojis(
          getEmojisByCategory(database.categories),
          dialogData[patternInputName]
        ),
      })
    }, 200)

    var getDialogConfig = function () {
      var body = {
        type: 'tabpanel',
        tabs: database.categories.map(function (cat) {
          return {
            title: cat.name,
            name: cat.name,
            items: [
              {
                label: 'Search',
                type: 'input',
                name: patternInputName,
              },
              {
                type: 'collection',
                name: 'results',
              },
            ],
          }
        }),
      }
      return {
        title: 'twemoji',
        size: 'normal',
        body: body,
        initialData: {
          pattern: '',
          results: getEmojisByCategory(database.categories),
        },
        onTabChange: function (dialogApi, details) {
          currentCategory = details.newTabName
          handleFilter(dialogApi)
        },
        onChange: handleFilter,
        onAction: function (dialogApi, actionData) {
          if (actionData.name === 'results') {
            insertEmoticon(editor, actionData.value, pluginUrl)
            dialogApi.close()
          }
        },
        buttons: [
          {
            type: 'cancel',
            text: 'Close',
            primary: true,
          },
        ],
      }
    }

    var openDialog = function (editor, database) {
      var dialogApi = editor.windowManager.open(getDialogConfig())

      if (!database.hasLoaded) {
        dialogApi.block('Loading emoticons...')
        database
          .waitForLoad()
          .then(function () {
            dialogApi.redial(getDialogConfig())
            handleFilter(dialogApi)
            dialogApi.focus(patternInputName)
          })
          .catch(function (err) {
            dialogApi.redial({
              title: 'twemoji',
              body: {
                type: 'panel',
                items: [
                  {
                    type: 'alertbanner',
                    level: 'error',
                    icon: 'warning',
                    text: '<p>Could not load twemoji</p>',
                  },
                ],
              },
              buttons: [
                {
                  type: 'cancel',
                  text: 'Close',
                  primary: true,
                },
              ],
              initialData: {
                pattern: '',
                results: [],
              },
            })
            dialogApi.focus(patternInputName)
            dialogApi.showTab(currentCategory)
            dialogApi.unblock()
          })
      } else {
        dialogApi.showTab(currentCategory)
        dialogApi.focus(patternInputName)
      }
    }

    // Add a button that opens a window
    editor.ui.registry.addButton('twemoji', {
      icon: 'emoji',
      tooltip: 'twemoji',
      onAction: function () {
        // Open window
        openDialog(editor, database)
      },
    })

    return {
      getMetadata: function () {},
    }
  })
})(window)
