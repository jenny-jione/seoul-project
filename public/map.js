function printTest() {
  console.log("map.js 함수 실행");
}


var cnt = 0;
var mcnt = 0;
var center_of_seoul = new kakao.maps.LatLng(37.5642135, 127.0016985);

var seoul = [];

$.getJSON("seoul_dict.json", function(seouljson) {
  console.log("getJSON :: seoul_dict ok");
  seoul = seouljson;
});

function DrawSeoulMap(){
  $.getJSON("seoul_gu_10percent.json", function(geojson) {
    console.log("getJSON ok");

    var data = geojson.features;
    var coordinates = []; //좌표 저장할 배열
    var sig_name = ''; //행정 구 이름 SIG_KOR_NM
    var sig_code = ''; // 행정 구 코드 SIG_CD
    var districts = []; // 구 저장하는 배열

    $.each(data, function(index, val) {

      coordinates = val.geometry.coordinates;
      sig_name = val.properties.SIG_KOR_NM;
      sig_code = val.properties.SIG_CD;
      districts.push(sig_name);
      displayArea(coordinates, sig_name, sig_code);
    });
  });
}


var polygons_gu = [];
var polygons_dong = [];
var polygons_select = [];
var overlays = [];


// 행정구역 폴리곤 그리는 함수
function displayArea(coordinates, sig_name, sig_code){

  var path = []; // 폴리곤 그려줄 path 배열 (각 지역구 폴리곤)
  var points = []; // 중심좌표 구하기 위한 지역구 좌표들 배열
  var district_centers = []; // 각 지역구 중심좌표 저장하는 배열

  //console.log(coordinates)를 확인해보면 보면 [0]번째에 배열이 주로 저장이 됨.  그래서 [0]번째 배열에서 꺼내줌.
  $.each(coordinates[0], function(index, coordinate) { // 25번 반복
    var point = new Object();
    point.x = coordinate[1];
    point.y = coordinate[0];
    points.push(point);
    path.push(new kakao.maps.LatLng(coordinate[1], coordinate[0]));
  });

  district_centers.push(centroid(points));

  // 구 커스텀 오버레이
  $.each(district_centers, function(index, item) {
    customOverlay = new kakao.maps.CustomOverlay({});
    overlays.push(customOverlay);
  });

  // 다각형 생성
  var polygon = new kakao.maps.Polygon({
    map: map, // 다각형을 표시할 지도 객체
    path: path,
    strokeWeight: 3,
    strokeColor: '#8a4e91', // blue: 004c80; green: 00785c
    strokeOpacity: 0.8,
    fillColor: '#fff',
    fillOpacity: 0.7
  });

  //폴리곤 제거하기 위한 배열
  polygons_gu.push(polygon);

  // 다각형에 mouseover 이벤트를 등록하고 이벤트가 발생하면 폴리곤의 채움색을 변경
  kakao.maps.event.addListener(polygon, 'mouseover', function(mouseEvent) {
    polygon.setOptions({
      fillColor: '#e1b8e6' // blue: 09f
    });
    // console.log(++mcnt);
    document.getElementById("gu").innerHTML = sig_name;
    customOverlay.setContent('<div class="area">' + sig_name + '</div>');
    customOverlay.setPosition(mouseEvent.latLng);
    customOverlay.setMap(map);
  });


  // 다각형에 mousemove 이벤트를 등록하고 이벤트가 발생하면 커스텀 오버레이의 위치를 변경합니다 
  kakao.maps.event.addListener(polygon, 'mousemove', function(mouseEvent) {     
    customOverlay.setPosition(mouseEvent.latLng); 
  });


  // 다각형에 mouseout 이벤트를 등록하고 이벤트가 발생하면 폴리곤의 채움색을 원래색으로 변경
  kakao.maps.event.addListener(polygon, 'mouseout', function() {
    polygon.setOptions({fillColor: '#fff'});
    customOverlay.setMap(null);
  });


  // 다각형에 click 이벤트를 등록하고 이벤트가 발생하면 해당 지역 확대 & '구' 다각형은 모두 지우기
  kakao.maps.event.addListener(polygon, 'click', function() {
    // 현재 지도 레벨에서 2레벨 확대한 레벨
    // var level = map.getLevel() - 2;
    // TODO:23.01.11: 클릭한 구 크기에 맞게 확대하기 
    var level = map.getLevel() - 2;

    // 지도를 클릭된 폴리곤의 중앙 위치를 기준으로 확대합니다
    map.setLevel(level, {
      anchor: centroid(points),
      animate: {
        duration: 350 //확대 애니메이션 시간
      }
    });
    deletePolygon(polygons_gu); //폴리곤 제거
    deleteDistrict(overlays);

    // 클릭한 다각형만 다시 그리는 함수 호출
    redrawPolygon(path, sig_name, sig_code); // mouseover에 있던 name (ㅇㅇ구)
  });
}


// 폴리곤의 중심좌표를 구하는 함수 (해당 폴리곤 확대할 때 필요)
function centroid(points) {
  var i, j, len, p1, p2, f, area, x, y;

  area = x = y = 0;

  for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
    p1 = points[i];
    p2 = points[j];

    f = p1.y * p2.x - p2.y * p1.x;
    x += (p1.x + p2.x) * f;
    y += (p1.y + p2.y) * f;
    area += f * 3;
  }
  return new kakao.maps.LatLng(x / area, y / area);
}


// 지도 위 표시되고 있는 폴리곤 제거
function deletePolygon(polygons) {
  tmp = 0;
  for (var i = 0; i < polygons.length; i++) {
    polygons[i].setMap(null);
  }
  console.log("지 도 폴 리 곤 제 거  ? ")
  polygons = [];
}


// 지도 위에 있던 구 이름 제거
function deleteDistrict(overlays) {
  for (var i = 0; i < overlays.length; i++) {
    overlays[i].setMap(null);
  }
  overlays = [];
}


// clicked_gu에 속한 동 다각형 그리는 코드
function drawDong(sig_name, sig_code){
  console.log("drawDong start");
  $.getJSON("seoul_dong_10percent.json", function(geojson)
  {
    console.log("getJSON (dong) ok");

    var data = geojson.features;
    var d_coordinates = []; // 동 좌표 저장할 배열
    var emd_name = ''; // 행정동 이름
    var emd_code = ''; // 행정동 코드
    var dongs = []; // 동 저장하는 배열
    var count = 0;


    $.each(data, function(index, val) {
      d_coordinates = val.geometry.coordinates;
      // console.log(val.geometry.coordinates[0]);
      emd_name = val.properties.EMD_KOR_NM;
      emd_code = val.properties.EMD_CD;
      polygon_type = val.geometry.type;
      dongs.push(emd_name);

      // TODO: 23.01.09 강남구 신사동, 은평구 신사동 구분 방법 찾기 => 23.05.01 완료!
      if (sig_code == emd_code.substring(0, 5)) {
        if (polygon_type == 'MultiPolygon') {
          displayMultipolygonDong(d_coordinates, emd_name);
        } else {
          displayDong(d_coordinates, emd_name);
        }
      }
    });
  });
}


// 클릭한 다각형을 다시 그리는 함수
function redrawPolygon(path, sig_name, sig_code) {
  var polygon = new kakao.maps.Polygon({
    map: map, // 다각형을 표시할 지도 객체
    path: path,
    strokeWeight: 3,
    strokeColor: '#8a4e91', // blue: 004c80; green: 00785c, purple: 8a4e91
    strokeOpacity: 0.8,
    fillColor: '#fff',
    fillOpacity: 0.7
  });
  polygons_select.push(polygon);


  console.log("c l i c k : " + sig_name + sig_code);

  // 여기에 동 다각형 그리는 코드!!
  // TODO: 특정 구를 클릭하면 그 구 안에 있는 동들만 표시되도록 하기. => 23.01.10 완료.
  drawDong(sig_name, sig_code);
}


// 동 Polygon 생성
function displayDong(coordinates, name) {
  var path = []; // 폴리곤 그려줄 path 배열 (각 동 폴리곤)
  var points = []; // 중심좌표 구하기 위한 동 좌표들 배열
  var dong_centers = []; // 각 동 중심좌표 저장하는 배열

  var cnt = 0;
  //console.log(coordinates)를 확인해보면 보면 [0]번째에 배열이 주로 저장이 됨.  그래서 [0]번째 배열에서 꺼내줌.
  $.each(coordinates[0], function(index, coordinate)
  {
    var point = new Object();
    point.x = coordinate[1];
    point.y = coordinate[0];
    points.push(point);
    path.push(new kakao.maps.LatLng(coordinate[1], coordinate[0]));
  });

  dong_centers.push(centroid(points));


  // 다각형을 생성합니다
  var polygon = new kakao.maps.Polygon({
    map: map, // 다각형을 표시할 지도 객체
    path: path,
    strokeWeight: 1,
    strokeColor: '#8a4e91', // blue: 004c80; green: 00785c, purple: 8a4e91;
    strokeOpacity: 0.8,
    fillColor: '#fff',
    fillOpacity: 0.4
  });

  //폴리곤 제거하기 위한 배열
  polygons_dong.push(polygon);


  // 다각형에 mouseover 이벤트를 등록하고 이벤트가 발생하면 폴리곤의 채움색을 변경합니다
  kakao.maps.event.addListener(polygon, 'mouseover', function(mouseEvent)
  {
    polygon.setOptions({
      fillColor: '#e1b8e6', // blue: 09f, e1b8e6
    });
    // console.log(++mcnt);
    document.getElementById("dong").innerHTML = name;
    customOverlay.setContent('<div class="area">' + name + '</div>');
    customOverlay.setPosition(mouseEvent.latLng);
    customOverlay.setMap(map);
  });


  // 다각형에 mousemove 이벤트를 등록하고 이벤트가 발생하면 커스텀 오버레이의 위치를 변경합니다 
  kakao.maps.event.addListener(polygon, 'mousemove', function(mouseEvent) {     
    customOverlay.setPosition(mouseEvent.latLng); 
  });


  // 다각형에 mouseout 이벤트를 등록하고 이벤트가 발생하면 폴리곤의 채움색을 원래색으로 변경합니다
  kakao.maps.event.addListener(polygon, 'mouseout', function() {
    polygon.setOptions({fillColor: '#fff'});
    customOverlay.setMap(null);
  });
}


// 동 Polygon 생성 (MultiPolygon일 때)
function displayMultipolygonDong(coordinates, name) {
  var polygonPath = [];
  $.each(coordinates, function(index, val2)
  {
    var coordinates2 = [];
    $.each(val2[0], function(index2, coordinate) {
      coordinates2.push(new kakao.maps.LatLng(coordinate[1], coordinate[0]));
    });
    polygonPath.push(coordinates2);
  });

  // 다각형을 생성합니다
  var polygon = new kakao.maps.Polygon({
    map: map, // 다각형을 표시할 지도 객체
    path: polygonPath,
    strokeWeight: 1,
    strokeColor: '#8a4e91', // blue: 004c80; green: 00785c, purple: 8a4e91;
    strokeOpacity: 0.8,
    fillColor: '#fff',
    fillOpacity: 0.4
  });

  //폴리곤 제거하기 위한 배열
  polygons_dong.push(polygon);


  // 다각형에 mouseover 이벤트를 등록하고 이벤트가 발생하면 폴리곤의 채움색을 변경합니다
  kakao.maps.event.addListener(polygon, 'mouseover', function(mouseEvent) {
    polygon.setOptions({
      fillColor: '#e1b8e6', // blue: 09f, e1b8e6
    });
    // console.log(++mcnt);
    document.getElementById("dong").innerHTML = name;
    customOverlay.setContent('<div class="area">' + name + '</div>');
    customOverlay.setPosition(mouseEvent.latLng);
    customOverlay.setMap(map);
  });


  // 다각형에 mousemove 이벤트를 등록하고 이벤트가 발생하면 커스텀 오버레이의 위치를 변경합니다 
  kakao.maps.event.addListener(polygon, 'mousemove', function(mouseEvent) {     
    customOverlay.setPosition(mouseEvent.latLng); 
  });


  // 다각형에 mouseout 이벤트를 등록하고 이벤트가 발생하면 폴리곤의 채움색을 원래색으로 변경합니다
  kakao.maps.event.addListener(polygon, 'mouseout', function() {
    polygon.setOptions({fillColor: '#fff'});
    customOverlay.setMap(null);
  });
}


// resetPolygon
function resetPolygon(polygons){
  for (var i = 0; i < polygons.length; i++) {
    polygons[i].setMap(null);
  }
  polygons = [];
}


// 버튼 클릭하면 처음 상태로 돌아가는 함수
function entireSeoulMap(){
  resetPolygon(polygons_gu);
  resetPolygon(polygons_dong);
  resetPolygon(polygons_select);
  map.setLevel(9);
  map.setCenter(center_of_seoul);
  DrawSeoulMap();
  document.getElementById("gu").innerHTML = "";
  document.getElementById("dong").innerHTML = "";
}
