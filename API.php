<?php
include './constant.php';

if (isset($_POST['function'])) {
  $paPDO = initDB();

  $function = $_POST['function'];
  $result = null;
  $centerLat = null;
  $centerLong = null;
  $radius = null;
  $gids = null;
  $poisType = null;

  if (isset($_POST['centerLat']))
    $centerLat = $_POST['centerLat'];

  if (isset($_POST['centerLong']))
    $centerLong = $_POST['centerLong'];

  if (isset($_POST['radius']))
    $radius = $_POST['radius'];

  if (isset($_POST['gids']))
    $gids = $_POST['gids'];

  if (isset($_POST['poisType']))
    $poisType = $_POST['poisType'];

  if ($function == 'queryPoints') {
    $result = queryPoints($paPDO, $centerLat, $centerLong, $radius, $gids, $poisType);
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
  $paPDO = new PDO('pgsql:host=localhost;dbname=ProjectCuoiKi;port=5432', 'postgres', PASSWORD);
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

function queryPoints($paPDO, $centerLat, $centerLong, $radius, $gids, $poisType)
{
  $query = 'SELECT ST_AsGeoJson(geom) as geo FROM public.gis_osm_pois_free_1 WHERE ST_Distance(ST_MakePoint(:centerLat, :centerLong)::geography, geom::geography) <= :radius ';
  $dataArr = ['centerLat' => $centerLat, 'centerLong' => $centerLong, 'radius' => $radius];

  if ($gids) {
    $gidsArr = explode(",", $gids);
    $gidsArrMap = [];
    $gidsQueryStr = "";

    foreach ($gidsArr as $k => $v) {
      $placeholder = ':gid' . strval($k);
      $gidsQueryStr .= $placeholder;
      $gidsArrMap = array_merge(
        $gidsArrMap,
        [$placeholder => $v]
      );
      if ($k < count($gidsArr) - 1)
        $gidsQueryStr .= ',';
    }

    $query .= 'AND ST_Intersects((SELECT ST_Union(geom) FROM public.gadm41_vnm_2 WHERE gid IN (' . $gidsQueryStr . ')), geom) ';
    $dataArr = array_merge($dataArr, $gidsArrMap);
  }

  if ($poisType) {
    $query .= 'AND fclass = :poisType ';
    $dataArr = array_merge($dataArr, ['poisType' => $poisType]);
  }

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
  $mySQLStatement = $paPDO->prepare('SELECT gid, ST_AsGeoJson(geom) as geo FROM public.gadm41_vnm_2 WHERE ST_Intersects(ST_MakePoint(:centerLat, :centerLong), geom)');
  $mySQLStatement->execute(['centerLat' => $centerLat, 'centerLong' => $centerLong]);

  return json_encode(getResult($mySQLStatement));
}
