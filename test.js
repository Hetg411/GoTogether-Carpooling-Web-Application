
function initMap() {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      const map = new google.maps.Map(document.getElementById("map"), {
        center: userLocation,
        zoom: 14,
      });

      new google.maps.Marker({
        position: userLocation,
        map: map,
        title: "You are here"
      });
    },
    () => {
      alert("Could not get your location");
    }
  );
}


 async
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap">

