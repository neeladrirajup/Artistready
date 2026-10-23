BEGIN;

INSERT INTO artistready.body_types(code,label,sort_order,male_fit,female_fit,neutral_fit)
VALUES
 ('petite','Petite',5,false,true,true),
 ('toned','Toned',25,false,true,true),
 ('stocky','Stocky',55,true,false,true),
 ('hourglass','Hourglass',75,false,true,true)
ON CONFLICT(code) DO UPDATE SET
 label=excluded.label,sort_order=excluded.sort_order,
 male_fit=excluded.male_fit,female_fit=excluded.female_fit,
 neutral_fit=excluded.neutral_fit,is_active=true;

UPDATE artistready.body_types
SET female_fit=code IN ('petite','slim','toned','medium','curvy','hourglass','full_rounded','self_describe','not_disclosed'),
    male_fit=code IN ('slim','lean_athletic','muscular','medium','broad_solid','stocky','full_rounded','self_describe','not_disclosed'),
    neutral_fit=true,
    sort_order=CASE code WHEN 'full_rounded' THEN 110 WHEN 'self_describe' THEN 120 WHEN 'not_disclosed' THEN 130 ELSE sort_order END
WHERE code IN ('slim','lean_athletic','muscular','medium','broad_solid','stocky','petite','toned','curvy','hourglass','full_rounded','self_describe','not_disclosed');

COMMIT;
