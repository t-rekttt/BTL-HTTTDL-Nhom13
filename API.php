<?php
include './constant.php';

if (isset($_POST['function'])) {
  $paPDO = initDB();

  $function = $_POST['function'];
  $result = null;
  $centerLat = null;
  $centerLong = null;
  $radiuses = null;
  $gids = null;
  $poisType = null;

  if (isset($_POST['centerLat']))
    $centerLat = $_POST['centerLat'];

  if (isset($_POST['centerLong']))
    $centerLong = $_POST['centerLong'];

  if (isset($_POST['radiuses']))
    $radiuses = json_decode($_POST['radiuses'], 1);

  if (isset($_POST['gids']))
    $gids = $_POST['gids'];

  if (isset($_POST['poisType']))
    $poisType = $_POST['poisType'];

  if ($function == 'queryPoints') {
    $result = queryPoints($paPDO, $radiuses, $gids, $poisType);
  } else if ($function == 'getPointOfInterestTypes') {
    $result = getPointOfInterestTypes($paPDO);
  } else if ($function == 'queryZones') {
    $result = queryZones($paPDO, $centerLat, $centerLong);
  }

  echo $result;

  closeDB($paPDO);
}

function initDB()
{
  // Kết nối CSDL
  $paPDO = new PDO('pgsql:host=localhost;dbname='.TABLENAME.';port=5432', 'postgres', PASSWORD);
  return $paPDO;
}

function query($paPDO, $paSQLStr)
{
  try {
    // Khai báo exception
    $paPDO->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Sử đụng Prepare 
    $stmt = $paPDO->prepare($paSQLStr);
    // Thực thi câu truy vấn
    $stmt->execute();

    // Khai báo fetch kiểu mảng kết hợp
    $stmt->setFetchMode(PDO::FETCH_ASSOC);

    // Lấy danh sách kết quả
    $paResult = $stmt->fetchAll();
    return $paResult;
  } catch (PDOException $e) {
    echo "Thất bại, Lỗi: " . $e->getMessage();
    return null;
  }
}

function getResult($myPreparedSQLStatement)
{
  return $myPreparedSQLStatement->fetchAll();
}

function closeDB($paPDO)
{
  // Ngắt kết nối
  $paPDO = null;
}

function queryPoints($paPDO, $radiuses, $gids, $poisType)
{
  $query = 'SELECT ST_AsGeoJson(geom) as geo, name FROM public.gis_osm_pois_free_1 WHERE ';
  $dataArr = [];
  $and = false;

  foreach ($radiuses as $k => $radius) {
    // var_dump($radius);

    $placeholderCenterLat = 'centerLat' . strval($k);
    $placeholderCenterLong = 'centerLong' . strval($k);
    $placeholderRadius = 'radius' . strval($k);

    if ($and)
      $query .= 'AND ';
    $query .= 'ST_Distance(ST_MakePoint(:' . $placeholderCenterLat . ', :' . $placeholderCenterLong . ')::geography, geom::geography) <= :' . $placeholderRadius . ' ';
    $dataArr = array_merge($dataArr, [
      $placeholderCenterLat => $radius['latlong'][0],
      $placeholderCenterLong => $radius['latlong'][1],
      $placeholderRadius => $radius['radius']
    ]);
    $and = true;
  }

  if ($gids) {
    $gidsArr = explode(",", $gids);
    $gidsArrMap = [];
    $gidsQueryStr = "";

    foreach ($gidsArr as $k => $v) {
      $placeholder = 'gid' . strval($k);
      $gidsQueryStr .= ':' . $placeholder;
      $gidsArrMap = array_merge(
        $gidsArrMap,
        [$placeholder => $v]
      );
      if ($k < count($gidsArr) - 1)
        $gidsQueryStr .= ',';
    }

    if ($and)
      $query .= 'AND ';
    $query .= 'ST_Intersects((SELECT ST_Union(geom) FROM public.gadm41_vnm_2 WHERE gid IN (' . $gidsQueryStr . ')), geom) ';
    $dataArr = array_merge($dataArr, $gidsArrMap);
    $and = true;
  }

  if ($poisType) {
    if ($and)
      $query .= 'AND ';
    $query .= 'fclass = :poisType ';
    $dataArr = array_merge($dataArr, ['poisType' => $poisType]);
    $and = true;
  }

  // var_dump($dataArr);
  // var_dump($query);

  $mySQLStatement = $paPDO->prepare($query);
  $mySQLStatement->execute($dataArr);

  return json_encode(getResult($mySQLStatement));
}

function getPointOfInterestTypes($paPDO)
{
  $mySQLStatement = $paPDO->prepare('SELECT DISTINCT(fclass) FROM public.gis_osm_pois_free_1');
  $mySQLStatement->execute([]);

  return json_encode(getResult($mySQLStatement));
}

function queryZones($paPDO, $centerLat, $centerLong)
{
  $mySQLStatement = $paPDO->prepare('SELECT name_1, type_2, name_2, gid, ST_AsGeoJson(geom) as geo FROM public.gadm41_vnm_2 WHERE ST_Intersects(ST_MakePoint(:centerLat, :centerLong), geom)');
  $mySQLStatement->execute(['centerLat' => $centerLat, 'centerLong' => $centerLong]);

  return json_encode(getResult($mySQLStatement));
}
