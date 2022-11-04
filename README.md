# BTL-HTTDL-Nhom13
Mã nguồn BTL môn HTTT Địa Lý - Nhóm 13 - ĐH Thuỷ Lợi
Tài liệu họp nhóm: https://vietthao2000.notion.site/BTL-HTTT-a-L-Nh-m-13-0971c386d2d14e59a49c9b4af6dec33b

# I. Công nghệ sử dụng
- **Frontend**:
    - HTML, CSS, JS
    - Vue.JS: https://v2.vuejs.org/
    - WebGIS: [https://ungdungmoi.edu.vn/webgis-la-gi.html](https://ungdungmoi.edu.vn/webgis-la-gi.html)
- **Backend**: PHP, GeoServer
- **Database**: PostgreSQL
- **Thư viện/extensions cho GIS**:
    - OpenLayers: [https://openlayers.org/](https://openlayers.org/)
    - PostGIS: [https://postgis.net/](https://postgis.net/)
    - PGRouting: [https://pgrouting.org/](https://pgrouting.org/)

# II. Mô tả tính năng:

## II.1. Tìm kiếm địa điểm:

1. Người dùng chọn vị trí A, bán kính tìm kiếm R, vùng tìm kiếm và loại địa điểm
2. Query các địa điểm thoả mãn nằm trong bán kính R và trong vùng tìm kiếm (nếu người dùng không chọn vùng tìm kiếm thì tìm kiếm trên mọi vùng)
3. Hiển thị kết quả lên bản đồ

## II.2. Tìm đường đi ngắn nhất:

1. Người dùng click chọn một địa điểm B trong tập những điểm đã hiển thị ở bước trên
2. Query tập các con đường đi từ A đến B, sort theo độ dài
3. Chọn đường đi ngắn nhất
   
# III. Hướng dẫn sử dụng
## III.1. Import và khởi tạo dữ liệu tìm đường đi ngắn nhất
1. Import 3 shapefile sau vào database bằng PostGIS:
- gadm41_VNM_2.shp: Dữ liệu địa giới hành chính Việt Nam
- gis_osm_pois_free_1.shp: Dữ liệu địa điểm (point of interests) Việt Nam, phục vụ cho việc tìm địa điểm
- hanoi_round.shp: Dữ liệu đường trong khu vực Hà Nội phục vụ cho tìm đường đi ngắn nhất
2. Mở PGAdmin lên và chạy các query sau:
```SQL
# Thêm extension cần thiết để thực hiện routing
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;
CREATE EXTENSION pgrouting;

# Thêm cột source và target, đánh index
ALTER TABLE hanoi_round ADD COLUMN source integer;
ALTER TABLE hanoi_round ADD COLUMN target integer;
CREATE INDEX source_idx ON hanoi_round(source);
CREATE INDEX target_idx ON hanoi_round(target);

# Xoá các hàng mà cột source bị null
DELETE FROM hanoi_round WHERE source is null;

# Thêm toạ độ điểm bắt đầu và kết thúc của mỗi đoạn đường
ALTER TABLE hanoi_round ADD COLUMN x1 double precision;
ALTER TABLE hanoi_round ADD COLUMN y1 double precision;
ALTER TABLE hanoi_round ADD COLUMN x2 double precision;
ALTER TABLE hanoi_round ADD COLUMN y2 double precision;

UPDATE hanoi_round SET x1=ST_X(ST_StartPoint(ST_LineMerge(geom)));
UPDATE hanoi_round SET y1=ST_Y(ST_StartPoint(ST_LineMerge(geom)));
UPDATE hanoi_round SET x2=ST_X(ST_EndPoint(ST_LineMerge(geom)));
UPDATE hanoi_round SET y2=ST_Y(ST_EndPoint(ST_LineMerge(geom)));

# Khai báo hàm A* tìm đường đi ngắn nhất
CREATE OR REPLACE FUNCTION pgr_fromAtoB(
    IN edges_subset varchar,
    IN x1 double precision,
    IN y1 double precision,
    IN x2 double precision,
    IN y2 double precision,
    OUT seq INTEGER,
    OUT cost FLOAT,
    OUT name TEXT,
    OUT geom geometry,
    OUT heading FLOAT
)
RETURNS SETOF record AS
$BODY$

WITH
    astar AS (
        SELECT * FROM pgr_aStar(
            'SELECT gid as id, source, target, st_length(geom) AS cost FROM ' || $1,
            -- source
            (SELECT id FROM hanoi_round_vertices_pgr
                ORDER BY the_geom <-> ST_SetSRID(ST_Point(x1,y1),4326) LIMIT 1),
            -- target
            (SELECT id FROM hanoi_round_vertices_pgr
                ORDER BY the_geom <-> ST_SetSRID(ST_Point(x2,y2),4326) LIMIT 1),
        false) -- undirected
    ),
    with_geom AS (
        SELECT astar.seq, astar.cost, hanoi_round.name,
        CASE
            WHEN astar.node = hanoi_round.source THEN geom
            ELSE ST_Reverse(geom)
        END AS route_geom
        FROM astar JOIN hanoi_round
        ON (edge = gid) ORDER BY seq
    )
    SELECT *,
    ST_azimuth(ST_StartPoint(route_geom), ST_EndPoint(route_geom))
    FROM with_geom;
$BODY$
LANGUAGE 'sql';
```
3. Vào GeoServer dashboard. Chọn Layers -> Add a new layer -> Chọn workspace tương ứng -> Configure new SQL view...

![image](https://user-images.githubusercontent.com/9071846/199900129-d480aacb-b82b-4adc-b4cf-2da5a0d68dd1.png)

4. Điền
``` SQL
SELECT (route.geom) FROM 
    (SELECT geom FROM pgr_fromAtoB('hanoi_round', %x1%, %y1%, %x2%, %y2%) ORDER BY seq)
AS route
```

5. Chọn Guess parameters from SQL, nhập Default value = 0 và Validation regular expression = `^-?[\d.]+$`

![image](https://user-images.githubusercontent.com/9071846/199900600-bcbaf5ce-024f-43aa-b680-5f7f93c065bf.png)

6. Trong phần Attributes, ấn Refresh, trong Type chọn LineString, SRID chọn hệ tọa độ của data, ở đây là 4326.

![image](https://user-images.githubusercontent.com/9071846/199900893-2abef203-47ba-4a87-9f15-92c71709a350.png)

7. Nhấn Save. Tiếp theo chúng ta điền các thông tin khác cho layer. Bạn có thể không cần điền thêm gì, chỉ cần ấn Compute from data và Compute from native bounds để tạo bộ khung cho layer.

![image](https://user-images.githubusercontent.com/9071846/199901095-4a654e8a-2da4-4a05-bbcb-6afa532994e3.png)

## III.2. Config XAMPP server
1. Copy thư mục src vào htdocs trong XAMPP server, đổi thành tên tuỳ ý
2. Copy file `constant.php.example` thành `constant.php`, sửa `TABLENAME` và `PASSWORD` tương ứng với database mà bạn vừa import shapefiles vào.

![image](https://user-images.githubusercontent.com/9071846/199902463-4a97fd3e-cc63-43d4-ba6d-919e56068b59.png)

3. Start XAMPP server

![image](https://user-images.githubusercontent.com/9071846/199903082-b934397e-db4a-4493-a955-cf7e47e2958e.png)

## III.3. Truy cập ứng dụng
- Truy cập ứng dụng bằng đường dẫn http

![image](https://user-images.githubusercontent.com/9071846/199903194-ecf37798-62b0-4567-a3a8-26d385e92f54.png)
