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
  $result = [];

  foreach ($myPreparedSQLStatement as $row) {
    array_push($result, $row);
  }

  return $result;
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
    $query .= 'AND ST_Contains((SELECT ST_Union(geom) as union FROM public.gadm41_vnm_3 WHERE gid IN (:gids)), geom) ';
    $dataArr = array_merge($dataArr, ['gids' => $gids]);
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
