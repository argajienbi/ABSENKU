(async () => {
   const urls = [
      "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/tiny_face_detector_model-weights_manifest.json",
      "https://justadudewhohacks.github.io/face-api.js/models/tiny_face_detector_model-weights_manifest.json",
      "https://vladmandic.github.io/face-api/model/tiny_face_detector_model-weights_manifest.json",
      "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json"
   ];
   
   for (let url of urls) {
       try {
           const res = await fetch(url);
           console.log(url, res.status);
       } catch (e) {
           console.log(url, e.message);
       }
   }
})();
