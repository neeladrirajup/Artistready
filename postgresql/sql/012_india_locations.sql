SET ROLE artistready_owner;
SET search_path=artistready,pg_catalog;

-- Codes follow the National Portal of India's State/UT directory.
CREATE TABLE india_states (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z]{2,3}$'),
 name text NOT NULL UNIQUE CHECK (length(btrim(name)) > 0),
 is_union_territory boolean NOT NULL DEFAULT false,
 is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE india_cities (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 state_id bigint NOT NULL REFERENCES india_states(id) ON UPDATE CASCADE ON DELETE RESTRICT,
 name text NOT NULL CHECK (length(btrim(name)) > 0),
 is_active boolean NOT NULL DEFAULT true,
 UNIQUE (state_id,name)
);
CREATE INDEX india_cities_state_name_idx ON india_cities(state_id,name);

INSERT INTO india_states(code,name,is_union_territory) VALUES
 ('AN','Andaman and Nicobar Islands',true),('AP','Andhra Pradesh',false),
 ('AR','Arunachal Pradesh',false),('AS','Assam',false),('BR','Bihar',false),
 ('CH','Chandigarh',true),('CG','Chhattisgarh',false),
 ('DN','Dadra and Nagar Haveli and Daman and Diu',true),('DL','Delhi',true),
 ('GA','Goa',false),('GJ','Gujarat',false),('HR','Haryana',false),
 ('HP','Himachal Pradesh',false),('JK','Jammu and Kashmir',true),
 ('JH','Jharkhand',false),('KA','Karnataka',false),('KL','Kerala',false),
 ('LA','Ladakh',true),('LD','Lakshadweep',true),('MP','Madhya Pradesh',false),
 ('MH','Maharashtra',false),('MN','Manipur',false),('ML','Meghalaya',false),
 ('MZ','Mizoram',false),('NL','Nagaland',false),('OD','Odisha',false),
 ('PY','Puducherry',true),('PB','Punjab',false),('RJ','Rajasthan',false),
 ('SK','Sikkim',false),('TN','Tamil Nadu',false),('TS','Telangana',false),
 ('TR','Tripura',false),('UP','Uttar Pradesh',false),('UK','Uttarakhand',false),
 ('WB','West Bengal',false);

-- Initial app location choices, not an exhaustive census town directory.
WITH seed(code,cities) AS (VALUES
 ('AN',ARRAY['Port Blair','Diglipur','Mayabunder','Rangat','Car Nicobar']),
 ('AP',ARRAY['Visakhapatnam','Vijayawada','Guntur','Tirupati','Kurnool','Nellore','Rajahmundry','Kakinada','Anantapur','Kadapa']),
 ('AR',ARRAY['Itanagar','Naharlagun','Pasighat','Tawang','Ziro','Bomdila']),
 ('AS',ARRAY['Guwahati','Dibrugarh','Silchar','Jorhat','Tezpur','Nagaon','Tinsukia']),
 ('BR',ARRAY['Patna','Gaya','Bhagalpur','Muzaffarpur','Darbhanga','Purnia','Bihar Sharif']),
 ('CH',ARRAY['Chandigarh']),
 ('CG',ARRAY['Raipur','Bhilai','Bilaspur','Durg','Korba','Jagdalpur','Rajnandgaon']),
 ('DN',ARRAY['Daman','Diu','Silvassa','Dadra']),
 ('DL',ARRAY['New Delhi','Delhi','Dwarka','Rohini','Shahdara']),
 ('GA',ARRAY['Panaji','Margao','Vasco da Gama','Mapusa','Ponda']),
 ('GJ',ARRAY['Ahmedabad','Surat','Vadodara','Rajkot','Gandhinagar','Bhavnagar','Jamnagar','Junagadh']),
 ('HR',ARRAY['Gurugram','Faridabad','Panipat','Ambala','Hisar','Karnal','Rohtak','Sonipat']),
 ('HP',ARRAY['Shimla','Dharamshala','Solan','Mandi','Kullu','Hamirpur','Una']),
 ('JK',ARRAY['Srinagar','Jammu','Anantnag','Baramulla','Udhampur','Kathua']),
 ('JH',ARRAY['Ranchi','Jamshedpur','Dhanbad','Bokaro','Hazaribagh','Deoghar']),
 ('KA',ARRAY['Bengaluru','Mysuru','Mangaluru','Hubballi','Belagavi','Shivamogga','Davangere','Ballari','Kalaburagi','Udupi']),
 ('KL',ARRAY['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Alappuzha','Palakkad','Kannur','Kottayam']),
 ('LA',ARRAY['Leh','Kargil','Diskit']),
 ('LD',ARRAY['Kavaratti','Agatti','Minicoy','Andrott']),
 ('MP',ARRAY['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Satna','Rewa']),
 ('MH',ARRAY['Mumbai','Pune','Nagpur','Nashik','Thane','Navi Mumbai','Aurangabad','Solapur','Kolhapur','Amravati']),
 ('MN',ARRAY['Imphal','Thoubal','Kakching','Bishnupur','Churachandpur']),
 ('ML',ARRAY['Shillong','Tura','Jowai','Nongpoh','Nongstoin']),
 ('MZ',ARRAY['Aizawl','Lunglei','Champhai','Serchhip','Kolasib']),
 ('NL',ARRAY['Kohima','Dimapur','Mokokchung','Tuensang','Wokha']),
 ('OD',ARRAY['Bhubaneswar','Cuttack','Rourkela','Berhampur','Sambalpur','Puri','Balasore']),
 ('PY',ARRAY['Puducherry','Karaikal','Mahe','Yanam']),
 ('PB',ARRAY['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Mohali','Hoshiarpur']),
 ('RJ',ARRAY['Jaipur','Jodhpur','Udaipur','Kota','Ajmer','Bikaner','Alwar','Bharatpur']),
 ('SK',ARRAY['Gangtok','Namchi','Gyalshing','Mangan','Rangpo']),
 ('TN',ARRAY['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Erode','Vellore','Thoothukudi','Thanjavur']),
 ('TS',ARRAY['Hyderabad','Warangal','Nizamabad','Karimnagar','Khammam','Mahbubnagar','Ramagundam','Nalgonda']),
 ('TR',ARRAY['Agartala','Dharmanagar','Udaipur','Kailasahar','Belonia']),
 ('UP',ARRAY['Lucknow','Kanpur','Varanasi','Agra','Prayagraj','Meerut','Ghaziabad','Noida','Gorakhpur','Mathura']),
 ('UK',ARRAY['Dehradun','Haridwar','Rishikesh','Haldwani','Roorkee','Nainital','Rudrapur']),
 ('WB',ARRAY['Kolkata','Howrah','Siliguri','Durgapur','Asansol','Kharagpur','Bardhaman','Darjeeling'])
)
INSERT INTO india_cities(state_id,name)
SELECT s.id,city.name FROM seed
JOIN india_states s ON s.code=seed.code
CROSS JOIN LATERAL unnest(seed.cities) AS city(name);

CREATE PROCEDURE read_india_states(INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'code',code,'name',name,
  'isUnionTerritory',is_union_territory) ORDER BY name),'[]'::jsonb)
 INTO p_result FROM artistready.india_states WHERE is_active;
END $$;

CREATE PROCEDURE read_india_cities(p_state_code text,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',c.id,'stateId',s.id,
  'name',c.name) ORDER BY c.name),'[]'::jsonb)
 INTO p_result FROM artistready.india_cities c
 JOIN artistready.india_states s ON s.id=c.state_id
 WHERE s.code=upper(btrim(p_state_code)) AND s.is_active AND c.is_active;
END $$;

REVOKE ALL ON TABLE india_states,india_cities FROM PUBLIC;
REVOKE ALL ON PROCEDURE read_india_states(jsonb),read_india_cities(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE read_india_states(jsonb),read_india_cities(text,jsonb) TO artistready_api;
RESET ROLE;
