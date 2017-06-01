# nativeGLplayer
This is a webGL video player constructed  with video tag and native webGL. Feel free to fork this for further use.

# Browser
Firefox in Ubuntu 14.04.

# Execution
## Clone the repository:

````
git clone https://github.com/Justin790126/nativeGLplayer.git
cd  nativeGLplayer
````
## Assign source video
Feed source video URL as **first argument** in [nativeGLplayer](/main.js) constructor.
````
function main() {
  var player = new nativeGLplayer('path_to_your_video.mp4', 900, 504, document.body);
}
````

## For firfox users:

````
firefox index.html
````

