#pragma strict

var appearance: tk2dAnimatedSprite;
//----------------------------------------
//  Game-varying state
//----------------------------------------
private var health = 0;
private var state = "idle";

function Start () {
	collider.isTrigger = true;
}

function OnSpawn()
{
    state = "active";
    health = 5;
    this.appearance.color = Color(1,1,1,1);
    // load whole appearance
    this.appearance.Play();
    this.appearance.SetFrame(0);
    this.appearance.Pause();
    transform.localScale = Vector3(1.0, 1.0, 1.0);
}

function Update () {
	
}

function HitByBullet () {
	health -= 1;
	if ( health <= 0 ) {
		var state = "broken";
		// play through to broken-ness
		this.appearance.Play();
	}
}

function IsWhole () {
	return state == "active";
}