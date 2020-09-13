## Instructions

A plugin that let you insert [twemoji](https://twemoji.twitter.com/) image in tinymce5.x. Currently use twemoji v13.0.1

### Why

After tinymce5.x, it officially only provid the unicode emoji, so it display different in different system, and the compatibility is also terrible. Insert the image is the best way!

### Category

The categories are generated from here https://emojipedia.org/, it is a common emoji category, so there are many twemoji haven't been used.

### Sprite

The sprites generated from https://www.toptal.com/developers/css/sprite-generator.

## Usage

```javascript
tinymce.init({
    ...
    plugins: 'twemoji',
    toolbar: 'twemoji',
    ...
});
```

#### Result

[![w0aIL8.png](https://s1.ax1x.com/2020/09/13/w0aIL8.png)](https://imgchr.com/i/w0aIL8)  
[![w0azLT.png](https://s1.ax1x.com/2020/09/13/w0azLT.png)](https://imgchr.com/i/w0azLT)

## Todo

- More comprehensive categories and keywords for every emoji.
- Internationalization.
