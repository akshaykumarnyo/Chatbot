-- ============================================================
-- Seed Data — Demo users + sample sales records
-- ============================================================

-- Demo users (password = "Password123!" hashed with bcrypt)
INSERT INTO users (email, full_name, password_hash, role) VALUES
  ('admin@salesai.io',  'Admin User',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBAJ.X4jK5Y5eG', 'admin'),
  ('akshay@salesai.io', 'Akshay Kumar','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBAJ.X4jK5Y5eG', 'user'),
  ('demo@salesai.io',   'Demo User',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBAJ.X4jK5Y5eG', 'user')
ON CONFLICT (email) DO NOTHING;

-- Sample sales data (Superstore-style dataset)
INSERT INTO sales_data
  (order_id,order_date,ship_date,ship_mode,customer_id,customer_name,segment,
   country,city,state,postal_code,region,product_id,category,sub_category,
   product_name,sales,quantity,discount,profit)
VALUES
-- Technology
('CA-2024-001','2024-01-05','2024-01-08','Second Class','CG-12520','Claire Gute','Consumer',
 'United States','Henderson','Kentucky','42420','South','TEC-PH-001','Technology','Phones','Samsung Galaxy S24',1499.98,2,0.00,449.99),
('CA-2024-002','2024-01-10','2024-01-13','First Class','DV-13045','Darrin Van Huff','Corporate',
 'United States','Los Angeles','California','90036','West','TEC-LA-001','Technology','Laptops','Dell XPS 15',2199.99,1,0.10,329.99),
('CA-2024-003','2024-01-15','2024-01-18','Standard Class','SO-20335','Sean O''Donnell','Consumer',
 'United States','Fort Lauderdale','Florida','33311','South','TEC-AC-001','Technology','Accessories','Logitech MX Keys',89.99,3,0.05,22.50),
-- Furniture
('CA-2024-004','2024-01-20','2024-01-25','Second Class','BH-11710','Brosina Hoffman','Consumer',
 'United States','Los Angeles','California','90032','West','FUR-CH-001','Furniture','Chairs','HON High-Back Chair',731.94,3,0.00,219.58),
('CA-2024-005','2024-01-22','2024-01-27','Standard Class','BH-11710','Brosina Hoffman','Consumer',
 'United States','Los Angeles','California','90032','West','FUR-TA-001','Furniture','Tables','Bretford CR4500',957.58,5,0.45,-383.03),
('CA-2024-006','2024-02-01','2024-02-05','Standard Class','AA-10315','Andrew Allen','Consumer',
 'United States','Concord','North Carolina','28027','South','FUR-BO-001','Furniture','Bookcases','Bush Stackable',403.16,2,0.00,100.79),
-- Office Supplies
('CA-2024-007','2024-02-05','2024-02-10','First Class','IM-15070','Irene Maddox','Consumer',
 'United States','Seattle','Washington','98103','West','OFF-ST-001','Office Supplies','Storage','Iris 3-Stack Tote',164.16,2,0.00,9.85),
('CA-2024-008','2024-02-10','2024-02-12','Same Day','HP-14815','Harold Pawlan','Home Office',
 'United States','Fort Worth','Texas','76106','Central','OFF-AR-001','Office Supplies','Art','BIC Soft Feel Ballpoint',6.00,3,0.20,-1.48),
('CA-2024-009','2024-02-14','2024-02-18','Second Class','PK-19075','Pete Kriz','Corporate',
 'United States','Madison','Wisconsin','53711','Central','OFF-BI-001','Office Supplies','Binders','Avery Non-Stick Binders',1102.40,32,0.40,-281.60),
('CA-2024-010','2024-02-20','2024-02-23','Standard Class','MJ-17815','Matt Johannson','Corporate',
 'United States','Chicago','Illinois','60601','Central','TEC-PH-002','Technology','Phones','Apple iPhone 15 Pro',3499.95,3,0.00,1049.99),
-- Q1 more records
('CA-2024-011','2024-03-01','2024-03-04','First Class','EB-13705','Elizabeth Braxton','Consumer',
 'United States','New York','New York','10024','East','TEC-LA-002','Technology','Laptops','Apple MacBook Pro 16',3899.99,1,0.00,779.99),
('CA-2024-012','2024-03-05','2024-03-09','Second Class','GP-14050','Gary Pryor','Consumer',
 'United States','Philadelphia','Pennsylvania','19140','East','FUR-CH-002','Furniture','Chairs','Ergonomic Mesh Chair',549.00,2,0.15,82.35),
('CA-2024-013','2024-03-12','2024-03-16','Standard Class','LS-17230','Lena Sanders','Home Office',
 'United States','Phoenix','Arizona','85034','West','OFF-PA-001','Office Supplies','Paper','Xerox Multipurpose Paper',29.98,5,0.00,7.49),
('CA-2024-014','2024-03-18','2024-03-22','Standard Class','AB-10015','Aaron Bergman','Corporate',
 'United States','Austin','Texas','78759','Central','TEC-CO-001','Technology','Copiers','Canon Color Laser',1449.00,1,0.20,289.80),
('CA-2024-015','2024-03-25','2024-03-28','First Class','CV-12775','Chloris Kastensmidt','Consumer',
 'United States','Houston','Texas','77095','Central','FUR-BO-002','Furniture','Bookcases','Sauder 5-Shelf Bookcase',329.99,1,0.00,82.50),
-- Q2
('CA-2024-016','2024-04-02','2024-04-06','Second Class','JD-15895','Jim Doyle','Consumer',
 'United States','Dallas','Texas','75001','Central','TEC-PH-003','Technology','Phones','Google Pixel 8',799.00,2,0.10,159.80),
('CA-2024-017','2024-04-10','2024-04-14','Standard Class','RP-19765','Roland Perez','Corporate',
 'United States','Miami','Florida','33101','South','OFF-EN-001','Office Supplies','Envelopes','Quality Bulk Envelopes',16.48,4,0.00,4.12),
('CA-2024-018','2024-04-20','2024-04-24','First Class','NK-18685','Nathan Kaufman','Consumer',
 'United States','Atlanta','Georgia','30301','South','FUR-FU-001','Furniture','Furnishings','Eldon Fold N Roll',240.00,6,0.25,-60.00),
('CA-2024-019','2024-05-01','2024-05-05','Second Class','CC-12370','Carlos Costa','Corporate',
 'United States','Denver','Colorado','80201','West','TEC-LA-003','Technology','Laptops','HP EliteBook 840',1649.00,2,0.05,247.35),
('CA-2024-020','2024-05-15','2024-05-19','Standard Class','SR-20905','Sung Rouse','Home Office',
 'United States','Portland','Oregon','97201','West','OFF-ST-002','Office Supplies','Storage','Fellowes Storage Drawers',77.60,4,0.00,19.40),
-- Q3
('CA-2024-021','2024-06-03','2024-06-07','First Class','DP-13000','Daryl Poole','Consumer',
 'United States','Las Vegas','Nevada','89101','West','TEC-AC-002','Technology','Accessories','Apple AirPods Pro',249.99,5,0.00,74.99),
('CA-2024-022','2024-07-08','2024-07-12','Second Class','MB-18085','Max Britton','Corporate',
 'United States','Boston','Massachusetts','02101','East','FUR-CH-003','Furniture','Chairs','Steelcase Leap Chair',1499.00,3,0.10,224.85),
('CA-2024-023','2024-08-14','2024-08-18','Standard Class','EH-13795','Eric Hoffmann','Consumer',
 'United States','Minneapolis','Minnesota','55401','Central','TEC-PH-004','Technology','Phones','OnePlus 12',699.99,1,0.00,139.99),
('CA-2024-024','2024-09-20','2024-09-24','First Class','KL-16285','Karen Leatherbury','Consumer',
 'United States','San Francisco','California','94102','West','TEC-LA-004','Technology','Laptops','Lenovo ThinkPad X1',1899.00,1,0.15,284.85),
-- Q4
('CA-2024-025','2024-10-05','2024-10-09','Second Class','WD-21520','William Donatelli','Corporate',
 'United States','New York','New York','10001','East','TEC-CO-002','Technology','Copiers','HP LaserJet Pro',649.99,2,0.00,194.99),
('CA-2024-026','2024-11-01','2024-11-05','Same Day','TH-21175','Troy Hutchinson','Consumer',
 'United States','Chicago','Illinois','60601','Central','OFF-BI-002','Office Supplies','Binders','Cardinal Premier Easy Open',28.99,10,0.00,7.25),
('CA-2024-027','2024-11-15','2024-11-19','Standard Class','RB-19360','Rick Bensley','Corporate',
 'United States','Seattle','Washington','98109','West','FUR-TA-002','Furniture','Tables','Lifetime 6-Foot Table',249.99,4,0.20,29.99),
('CA-2024-028','2024-12-02','2024-12-06','First Class','MD-17650','Michael Dominguez','Home Office',
 'United States','Los Angeles','California','90001','West','TEC-LA-005','Technology','Laptops','Microsoft Surface Pro 9',1799.00,2,0.00,359.80),
('CA-2024-029','2024-12-10','2024-12-14','Second Class','JS-16030','Janet Sheil','Consumer',
 'United States','Houston','Texas','77002','Central','TEC-AC-003','Technology','Accessories','Sony WH-1000XM5',349.99,3,0.10,69.99),
('CA-2024-030','2024-12-20','2024-12-24','Standard Class','PO-18850','Paul Patel','Corporate',
 'United States','Boston','Massachusetts','02109','East','OFF-ST-003','Office Supplies','Storage','Sterilite Storage Box',49.98,8,0.00,12.49)
ON CONFLICT (order_id) DO NOTHING;
