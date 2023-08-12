import ImageLayer from 'ol/layer/Image.js';
import Map from 'ol/Map.js';
import Projection from 'ol/proj/Projection.js';
import Static from 'ol/source/ImageStatic.js';
import View from 'ol/View.js';
import { getCenter } from 'ol/extent.js';

import { defaults as defaultInteractions } from 'ol/interaction.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { GeoJSON } from 'ol/format.js';
import { Feature } from 'ol';
import { Circle } from 'ol/geom';


let map;
let menuOpened = "";

document.addEventListener('DOMContentLoaded', initiate);

// document.getElementById("testButton2").addEventListener("click", () => closeOpenMenu());

function initiate() {
  const extent = [0, 0, 800, 950];
  const projection = new Projection({
    code: 'xkcd-image',
    units: 'pixels',
    extent: extent,
  });

  map = new Map({
    interactions: defaultInteractions(),
    layers: [
      new ImageLayer({
        source: new Static({
          url: './twokindsWorldMap.jpg',
          projection: projection,
          imageExtent: extent,
        }),
      }),
    ],
    target: 'map',
    view: new View({
      projection: projection,
      center: getCenter(extent),
      zoom: 1,
      extent: [0, 0, 800, 950],
      maxZoom: 10,
      smoothExtentConstraint: false,
      smoothResolutionConstraint: false,
    }),
  });

  const vectorLayer = new VectorLayer({
    source: new VectorSource({
      features: makeButtons([[392.5, 442.5, "ch1"], [375.4, 474.5, "ch2"], [326.3, 489.6, "ch3"], [306.6, 493.5, "ch4"], [268.5, 490.3, "ch5"], [223.7, 495.4, "ch6"], [213.7, 479.5, "ch7"], [202.1, 449.8, "ch8"], [263.3, 263.4, "ch9"], [400.5, 229.1, "ch9"], [425.1, 223.5, "ch10"], [413.8, 201.1, "ch11"], [414.2, 221.2, "ch12"], [446.4, 265.8, "ch13"]])
    })
  });

  function makeButtons(centers) {
    let output = []
    centers.forEach(center => {
      let feature = new Feature({
        geometry: new Circle([center[0], center[1]], 2),
        ContentReferenced: center[2]
      });
      output.push(feature)
    });
    return output
  }

  // Add vector layer to map 
  map.addLayer(vectorLayer);

  map.on('click', function (evt) {
    let featureClicked = false;
    // Loop through the features and layers at the clicked pixel
    map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
      featureClicked = true;
      // Check if the layer is the vectorLayer
      if (layer === vectorLayer) {
        if (menuOpened != feature.get("ContentReferenced")) {
          const element = document.getElementById(feature.get("ContentReferenced"))
          const width = parseFloat(element.getAttribute("openWidth"), 10)
          if (menuOpened != "") {
            closeOpenMenu(function () {
              openMenu(width, element);
            });
          }
          else
          {
            openMenu(width, element);
          }
        }
        else {
          closeOpenMenu()
        }
      }
    });

    if (!featureClicked) {
      closeOpenMenu()
    }
  });
}

function closeOpenMenu(callback) {
  if (menuOpened != "") {
    openMenu(0, document.querySelector('.panel:not([style="width: 0px;"])'), callback)
  }
}

//TODO: allow for menus opening up in other directions, from top, bottom, and left
let menuOpening = false
function openMenu(menuWidth, panel, callback) {
  if (menuOpening) {
    return
  }
  menuOpening = true

  if (menuWidth > 0) {
    menuOpened = panel.id
  } else {
    menuOpened = ""
  }

  let width = panel.offsetWidth;
  let requestId;

  const objectiveView = getPercentView(menuWidth - width); //get the final objective for the view of the map

  menuWidthG = menuWidth;

  function animate() {
    //calculate amount by which to change width of panel
    let change = Math.round((menuWidth - panel.offsetWidth + 60 * Math.sign(menuWidth - panel.offsetWidth)) / 10);
    if (Math.abs(change) > 40) {
      change = 40 * Math.sign(change);
    }

    //actually change the width
    width += change;

    //if the width is close enough to the target width, stop animating & set width to target width and view to target view
    if (Math.abs(width - menuWidth) < 2) {
      cancelAnimationFrame(requestId);
      panel.style.width = `${menuWidth}px`;
      updateMapToMatch(objectiveView, menuWidth);
      menuOpening = false;
      if (callback) {
        callback();
      }
    } else { //otherwise, keep animating, setting panel width to the new width, and updating the map view to match
      updateMapToMatch(getPercentView(change), width);
      panel.style.width = `${width}px`;
      requestId = requestAnimationFrame(animate);
    }
  }
  initialZoom = map.getView().getZoom();
  requestId = requestAnimationFrame(animate);
}

let initialZoom

function getPercentView(pixelsToRemove) {
  //find the perentage of the map that will be left after the window's size is changed, & calculate new view so as to keep the actual stuff you see constant
  const percentChange = 1 - pixelsToRemove / map.getSize()[0];
  const finalView = map.getView().calculateExtent().slice();
  finalView[2] = (finalView[2] - finalView[0]) * percentChange + finalView[0];
  return finalView;
}

let menuWidthG;
onresize = (event) => {updateMapToMatch(map.getView().calculateExtent(), menuWidthG);};

function updateMapToMatch(targetView, menuWidth) {
  //change the map's size to match the window's size, and update the map's view to match the new size
  document.getElementById('map').style.width = `${(window.innerWidth - menuWidth)}px`;
  map.updateSize();
  map.getView().fit(targetView);
}