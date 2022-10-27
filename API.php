<?php
include './constant.php';

if (isset($_POST['function'])) {
  $paPDO = initDB();

  $function = $_POST['function'];
  $result = null;

  if ($function == 'queryPointsInRadius') {
    $x = $_POST['x'];
    $y = $_POST['y'];
    $radius = $_POST['radius'];

    $result = queryPointsInRadius($paPDO, $x, $y, $radius);
  } else if ($function == 'queryPointsInRadiusAndAreas') {
    $x = $_POST['x'];
    $y = $_POST['y'];
    $radius = $_POST['radius'];
    $gids = $_POST['gids'];

    $result = queryPointsInRadiusAndAreas($paPDO, $x, $y, $radius, $gids);
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

function getResult($myPreparedSQLStatement) {
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

function queryPointsInRadius($paPDO, $x, $y, $radius) {
  $mySQLStatement = $paPDO->prepare('SELECT * FROM public.gis_osm_pois_free_1 WHERE ST_Distance(ST_MakePoint(:x, :y)::geography, geom::geography) <= :radius');
  $mySQLStatement->execute(['x' => $x, 'y' => $y, 'radius'=> $radius]);

  return json_encode(getResult($mySQLStatement));
}

function queryPointsInRadiusAndAreas($paPDO, $x, $y, $radius, $gids)
{
  $mySQLStatement = $paPDO->prepare('SELECT * FROM public.gis_osm_pois_free_1 WHERE ST_Distance(ST_MakePoint(:x, :y)::geography, geom::geography) <= :radius AND ST_Contains((SELECT ST_Union(geom) as union FROM public.gadm41_vnm_3 WHERE gid IN (:gids)), geom)');
  $mySQLStatement->execute(['x' => $x, 'y' => $y, 'radius' => $radius, 'gids' => $gids]);

  return json_encode(getResult($mySQLStatement));
}