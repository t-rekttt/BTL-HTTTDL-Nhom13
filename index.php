<?php
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bài tập lớn</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v7.1.0/ol.css">
  <!-- CSS only -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi" crossorigin="anonymous">
  <link rel="stylesheet" href="assets/css/style.css">
</head>

<body>
  <div class="container-fluid g-0" id="main">
    <div class="row">
      <div class="col-8">
        <div id="map"></div>
      </div>
      <div class="col">
        <div class="row mt-3">
          <div class="col-8 offset-2">
            <div class="row">
              <div class="col">
                <div class="mb-3">
                  <label class="form-label">
                    Chọn giới hạn vùng tìm kiếm
                  </label>
                  <select class="form-select" v-model="limitType">
                    <option value="point">Giới hạn bằng bán kính</option>
                    <option value="zone">Giới hạn bằng vùng</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">
                    Chọn loại địa điểm
                  </label>
                  <select class="form-select" v-model="poisType">
                    <option value="all">
                      All
                    </option>
                    <option v-for="poisType in poisTypes" :value="poisType" :key="poisType">
                      {{ formatPoisTypeName(poisType) }}
                    </option>
                  </select>
                </div>
    
                <button class="btn btn-primary" @click.prevent='doSearch()'>Tìm kiếm</button>
                <button class="btn btn-danger" @click.prevent='initMap()'>Đặt lại</button>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col" v-if="results">
                Tìm thấy {{ results.length }} kết quả
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/vue@2.7.13/dist/vue.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/ol@v7.1.0/dist/ol.js"></script>
  <!-- JavaScript Bundle with Popper -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-OERcA2EqjJCMA+/3y+gxIOqMEjwtxJY7qPCqsdltbNJuaOe923+mo//f6V8Qbsw3" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.1/jquery.min.js"></script>
  <script src="assets/js/main.js"></script>
</body>

</html>