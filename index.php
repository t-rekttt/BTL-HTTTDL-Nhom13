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
        <div class="row text-center mt-4">
          <h2>BẢNG ĐIỀU KHIỂN</h2>
        </div>
        <div class="row mt-3">
          <div class="col-10 offset-1">
            <div class="row mb-3">
              <div class="col">
                <label class="form-label">
                  Chọn chế độ
                </label>
                <select class="form-select" v-model="findType">
                  <option value="places">Tìm địa điểm</option>
                  <option value="shortestPath">Tìm đường đi ngắn nhất</option>
                </select>
              </div>
            </div>
            <div class="row">
              <div class=" col">
                <div class="mb-3">
                  <label class="form-label">
                    Chọn giới hạn tìm kiếm
                  </label>
                  <select class="form-select" v-model="limitType" :disabled="findType !== 'places'">
                    <option value="point">Giới hạn bằng khoảng cách</option>
                    <option value="zone">Giới hạn bằng vùng</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">
                    Chọn loại địa điểm
                  </label>
                  <select class="form-select" v-model="poisType" :disabled="findType !== 'places'">
                    <option value="all">
                      All
                    </option>
                    <option v-for="poisType in poisTypes" :value="poisType" :key="poisType">
                      {{ formatPoisTypeName(poisType) }}
                    </option>
                  </select>
                </div>

                <button class="btn btn-primary" @click.prevent='doSearch()' :disabled="findType !== 'places'">Tìm kiếm</button>
                <button class="btn btn-danger" @click.prevent='initMap()'>Đặt lại</button>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col text-success" v-if="results">
                <b>
                  Tìm thấy {{ results.length }} kết quả
                </b>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col text-danger" v-if="errMessage">
                <b>
                  Lỗi: {{ errMessage }}
                </b>
              </div>
            </div>
            <div class="row mt-3" v-if="radiuses.length">
              <div class="col">
                <div class="row">
                  <div class="col">
                    <b>
                      Các giới hạn khoảng cách hiện tại:
                    </b>
                  </div>
                </div>
                <div class="row mt-3">
                  <div class="col">
                    <table class="table table-striped table-bordered">
                      <thead>
                        <tr>
                          <th scope="col">STT</th>
                          <th scope="col">Toạ độ tâm</th>
                          <th scope="col">Khoảng cách</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(radius, i) in radiuses">
                          <td scope="row">{{ i + 1 }}</td>
                          <td>({{ radius.latlong[0] }}, {{ radius.latlong[1] }})</td>
                          <td>{{ formatLength(radius.radius) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div class="row mt-3" v-if="gids.length">
              <div class="col">
                <div class="row">
                  <div class="col">
                    <b>
                      Các giới hạn vùng hiện tại:
                    </b>
                  </div>
                </div>
                <div class="row">
                  <div class="ol">
                    <li v-for="zone in zoneData">
                      {{ zone.type_2 }} {{ zone.name_2 }}, {{ zone.name_1 }}
                    </li>
                  </div>
                </div>
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
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-OERcA2EqjJCMA+/3y+gxIOqMEjwtxJY7qPCqsdltbNJuaOe923+mo//f6V8Qbsw3" crossorigin="anonymous">
  </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.1/jquery.min.js"></script>
  <script src="assets/js/main.js"></script>
</body>

</html>