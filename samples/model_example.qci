
// This is a simple example QC file

// The output file name
$modelname "props_examples/example.mdl"

// Our input model
$body body "example.smd"

// Sequence has to be declared. Refer to the body's dmx file to use an empty animation
$sequence "idle" "example.dmx"

// We want to be a static prop
$staticprop

// Our collision model
$collisionmodel "example_phys.dmx"

// This model's materials are relative to these paths. Keep / as a fallback just in case
$cdmaterials "/"
$cdmaterials "models/props_examples/"

$definevariable Test "test"
$body -$Test$ foo/$Test$/bar
$body -$Test$ "foo/$Test$/bar"

$animation a_foobar foo/$Test$/bar {
   subtract a_foobar 0
   delta realtime loop
}
$sequence idle01 "a_foobar" activity ACT_IDLE

$illumposition 100 -0.24 0.23

$origin 0 10 .0 -.0001

// some weird unquoted and valid ascii
$sequence abc_!-@#$%*)|\/.,><:=?^ idle
$sequence :   idle
$sequence <   idle

// Semicolons are the only character from 33~127 range that need quoting
$sequence ";" idle 
