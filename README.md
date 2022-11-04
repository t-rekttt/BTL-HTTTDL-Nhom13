# BTL-HTTDL-Nhom13
Mã nguồn BTL môn HTTT Địa Lý - Nhóm 13 - ĐH Thuỷ Lợi

# Hướng dẫn sử dụng
## Import và tạo dữ liệu tìm đường đi ngắn nhất
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
