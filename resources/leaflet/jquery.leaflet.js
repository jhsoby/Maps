/**
 * JavaScript for Leaflet in the Maps extension.
 * @see https://www.mediawiki.org/wiki/Extension:Maps
 *
 * @author Pavel Astakhov < pastakhov@yandex.ru >
 * @author Peter Grassberger < petertheone@gmail.com >
 */
(function ($, mw, L) {
	$.fn.leafletmaps = function ( options ) {
		var _this = this;
		this.map = null;
		this.options = options;
		this.markers = [];
		this.markercluster = null;
		var apikeys = mw.config.get('egMapsLeafletLayersApiKeys') ;

		/**
		 * array point of all map elements (markers, lines, polygons, etc.)
		 * for map fit
		 */
		this.points = [];

		/**
		* Creates a new marker with the provided data and returns it.
		* @param {Object} properties Contains the fields lat, lon, title, text and icon
		* @return {L.Marker}
		*/
		this.createMarker = function (properties) {
			this.points.push( new L.LatLng(properties.lat, properties.lon) );

			var markerOptions = {
				title:properties.title
			};

			var marker = L.marker( [properties.lat, properties.lon], markerOptions );

			if (properties.hasOwnProperty('icon') && properties.icon !== '') {
				marker.setOpacity(0);

				var img = new Image();
				img.onload = function() {
					var icon = new L.Icon({
						iconUrl: properties.icon,
						iconSize: [ img.width, img.height ],
						iconAnchor: [ img.width / 2, img.height ],
						popupAnchor: [ -img.width % 2, -img.height*2/3 ]
					});

					marker.setIcon(icon);
					marker.setOpacity(1);
				};
				img.src = properties.icon;
			}

			if( properties.hasOwnProperty('text') && properties.text.length > 0 ) {
				marker.bindPopup( properties.text );
			}

			if ( options.copycoords ) {
				marker.on(
					'contextmenu',
					function( e ) {
						prompt(mw.msg('maps-copycoords-prompt'), e.latlng.lat + ',' + e.latlng.lng);
					}
				);
			}

			return marker;
		};

		/**
		 * Creates a new marker with the provided data, adds it to the map
		 * and returns it.
		 * @param {Object} properties Contains the fields lat, lon, title, text and icon
		 * @return {L.Marker}
		 */
		this.addMarker = function (properties) {
			var marker = this.createMarker(properties);
			if (!this.options.markercluster) {
				marker.addTo( this.map );
			}
			this.markers.push( marker );
			return marker;
		};

		this.removeMarker = function (marker) {
			this.map.removeLayer(marker);
			this.points = [];
			this.markers = this.markers.filter(function(object) {
				return object !== marker;
			});
		};

		this.removeMarkers = function () {
			if (this.markercluster) {
				this.map.removeLayer(this.markercluster);
				this.markercluster = null;
			}
			var map = this.map;
			$.each(this.markers, function(index, marker) {
				map.removeLayer(marker);
			});

			this.points = [];
			this.markers = [];
		};

		this.addLine = function (properties) {
			var options = {
				color: properties.strokeColor,
				weight:properties.strokeWeight,
				opacity:properties.strokeOpacity
			};

			var latlngs = [];
			for (var x = 0; x < properties.pos.length; x++) {
				latlngs.push([properties.pos[x].lat, properties.pos[x].lon]);
				this.points.push( new L.LatLng(properties.pos[x].lat, properties.pos[x].lon) );
			}

			var line = L.polyline(latlngs, options).addTo(this.map);

			if( properties.hasOwnProperty('text') && properties.text.trim().length > 0 ) {
				line.bindPopup( properties.text );
			}
		};

		this.addPolygon = function (properties) {
			properties.pos.forEach(function(position) {
				_this.points.push( new L.LatLng(position.lat, position.lon) );
			});

			var polygon = L.polygon(
				properties.pos.map(function(position) {
					return [position.lat, position.lon];
				}),
				{
					color: properties.strokeColor,
					weight:properties.strokeWeight,
					opacity:properties.strokeOpacity,
					fillColor:properties.fillColor,
					fillOpacity:properties.fillOpacity
				}
			);

			polygon.addTo(this.map);

			if( properties.hasOwnProperty('text') && properties.text.trim().length > 0 ) {
				console.log(properties.text);
				polygon.bindPopup( properties.text );
			}
		};

		this.addCircle = function (properties) {
			var circle = L.circle(
				[properties.centre.lat, properties.centre.lon],
				{
					radius: properties.radius,
					color: properties.strokeColor,
					weight:properties.strokeWeight,
					opacity:properties.strokeOpacity,
					fillColor:properties.fillColor,
					fillOpacity:properties.fillOpacity,
				}
			).addTo(this.map);

			this.points.push( new L.LatLng(properties.centre.lat, properties.centre.lon) );

			if( properties.hasOwnProperty('text') && properties.text.trim().length > 0 ) {
				circle.bindPopup( properties.text );
			}
		};

		this.addRectangle = function (properties) {
			this.points.push( new L.LatLng(properties.sw.lat, properties.sw.lon) );
			this.points.push( new L.LatLng(properties.ne.lat, properties.ne.lon) );

			var options = {
				color: properties.strokeColor,
				weight:properties.strokeWeight,
				opacity:properties.strokeOpacity,
				fillColor:properties.fillColor,
				fillOpacity:properties.fillOpacity
			};

			var bounds = [[properties.sw.lat, properties.sw.lon], [properties.ne.lat, properties.ne.lon]];

			var rectangle = L.rectangle( bounds, options ).addTo(this.map);

			if( properties.hasOwnProperty('text') && properties.text.trim().length > 0 ) {
				rectangle.bindPopup( properties.text );
			}
		};

		this.createMarkerCluster = function () {
			if ( !options.markercluster ) {
				return;
			}
			var markers = this.markers;

			var markercluster = new L.MarkerClusterGroup({
				maxClusterRadius: options.clustermaxradius,
				disableClusteringAtZoom: options.clustermaxzoom + 1,
				zoomToBoundsOnClick: options.clusterzoomonclick,
				spiderfyOnMaxZoom: options.clusterspiderfy,
				iconCreateFunction: function(cluster) {
					var childCount = cluster.getChildCount();

					var imagePath = mw.config.get( 'egMapsScriptPath' ) + '/resources/leaflet/cluster/';

					var styles = [
						{
							iconUrl: imagePath + 'm1.png',
							iconSize: [53, 52]
						},
						{
							iconUrl: imagePath + 'm2.png',
							iconSize: [56, 55]
						},
						{
							iconUrl: imagePath + 'm3.png',
							iconSize: [66, 65]
						},
						{
							iconUrl: imagePath + 'm4.png',
							iconSize: [78, 77]
						},
						{
							iconUrl: imagePath + 'm5.png',
							iconSize: [90, 89]
						}
					];

					var index = 0;
					var dv = childCount;
					while (dv !== 0) {
						dv = parseInt(dv / 10, 10);
						index++;
					}
					var index = Math.min(index, styles.length);
					index = Math.max(0, index - 1);
					index = Math.min(styles.length - 1, index);
					var style = styles[index];

					return new L.divIcon({
						iconSize: style.iconSize,
						className: '',
						html: '<img style="' +
						'" src="' + style.iconUrl + '" />' +
						'<span style="' +
						'position: absolute; font-size: 11px; font-weight: bold; text-align: center; ' +
						'top: 0; left: 0; ' +
						'line-height: ' + style.iconSize[1] + 'px;' +
						'width: ' + style.iconSize[0] + 'px;' +
						'">' + childCount + '</span>'
					});
				}
			});
			$.each(this.markers, function(index, marker) {
				markercluster.addLayer(marker);
			});
			if (this.markercluster) {
				this.map.removeLayer(this.markercluster);
				this.markercluster = null;
			}
			this.map.addLayer(markercluster);
			this.markercluster = markercluster;
		};

		this.addGeoJson = function(options) {
			if (options.geojson !== '') {
				var geoJson = options.geojson;
				var geoJsonLayer = L.geoJSON( geoJson ).addTo( this.map );

				this.points.push( geoJsonLayer.getBounds().getNorthEast() );
				this.points.push( geoJsonLayer.getBounds().getSouthWest() );
			}
		};

		this.setup = function () {

			var mapOptions = {};
			if (options.minzoom !== false ) mapOptions.minZoom = options.minzoom;
			if (options.maxzoom !== false ) mapOptions.maxZoom = options.maxzoom;

			if (options.enablefullscreen) {
				mapOptions.fullscreenControl = true;
				mapOptions.fullscreenControlOptions= {
					position: 'topleft'
				};
			}

			mapOptions.scrollWheelZoom = options.scrollwheelzoom;

			if (options.static) {
				mapOptions.scrollWheelZoom = false;
				mapOptions.doubleClickZoom = false;
				mapOptions.touchZoom = false;
				mapOptions.boxZoom = false;
				mapOptions.tap = false;
				mapOptions.keyboard = false;
				mapOptions.zoomControl = false;
				mapOptions.dragging = false;
			}

			var map = L.map( this.get(0), mapOptions ).fitWorld();
			this.map = map;

			var layers = {};
			$.each(options.layers.reverse(), function(index, layerName) {
				var options = {} ;
				var providerName = layerName.split('.')[0] ;
				if (apikeys.hasOwnProperty(providerName) && apikeys[providerName] !== '') {
					options.apikey = apikeys[providerName] ;
				}
				if (layerName === 'MapQuestOpen') {
					layers[layerName] = new window.MQ.TileLayer().addTo(map);
				} else {
					layers[layerName] = new L.tileLayer.provider(layerName,options).addTo(map);
				}
			});

			var overlaylayers = {};
			$.each(options.overlaylayers, function(index, overlaylayerName) {
				overlaylayers[overlaylayerName] = new L.tileLayer.provider(overlaylayerName).addTo(_this.map);
			});

			if (options.layers.length > 1) {
				L.control.layers(layers, overlaylayers).addTo(map);
			}

			if (options.resizable) {
				//TODO: Fix moving map when resized
				_this.resizable();
			}

			if (!options.locations) {
				options.locations = [];
			}

			// Add the markers.
			for (var i = options.locations.length - 1; i >= 0; i--) {
				this.addMarker(options.locations[i]);
			}

			// Add markercluster
			if (options.markercluster) {
				this.createMarkerCluster();
			}

			// Add lines
			if (options.lines) {
				for (var i = 0; i < options.lines.length; i++) {
					this.addLine(options.lines[i]);
				}
			}

			// Add polygons
			if (options.polygons) {
				for (var i = 0; i < options.polygons.length; i++) {
					this.addPolygon(options.polygons[i]);
				}
			}

			// Add circles
			if (options.circles) {
				for (var i = 0; i < options.circles.length; i++) {
					this.addCircle(options.circles[i]);
				}
			}

			// Add rectangles
			if (options.rectangles) {
				for (var i = 0; i < options.rectangles.length; i++) {
					this.addRectangle(options.rectangles[i]);
				}
			}

			this.addGeoJson(options);

			// Set map position (centre and zoom)
			var centre;
			if (options.centre === false) {
				switch ( this.points.length ) {
					case 0:
						centre = new L.LatLng(0, 0);
						break;
					case 1:
						centre = this.points[0];
						break;
					default:
						var bounds = new L.LatLngBounds( this.points );
						if (options.zoom === false) {
							map.fitBounds( bounds );
							centre = false;
						} else {
							centre = bounds.getCenter();
						}
						break;
				}
				this.points = [];
			} else {
				centre = new L.LatLng(options.centre.lat, options.centre.lon);
			}
			if(centre) {
				map.setView( centre, options.zoom !== false ? options.zoom : options.defzoom );
			}
		};

		this.getDependencies = function ( options ) {
			var dependencies = [];

			if (options.enablefullscreen) {
				dependencies.push( 'ext.maps.leaflet.fullscreen' );
			}

			if (options.resizable) {
				dependencies.push( 'ext.maps.resizable' );
			}

			if (options.markercluster) {
				dependencies.push( 'ext.maps.leaflet.markercluster' );
			}

			return dependencies;
		};

		mw.loader.using( this.getDependencies( options ) ).then( function() {
			_this.setup();
		} );

		return this;

	};
})(jQuery, window.mediaWiki, L);
