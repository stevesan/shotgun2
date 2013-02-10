#pragma strict

//----------------------------------------
//  Constants
//----------------------------------------
private var kInitialHealth = 15;

var healthBarAnim:tk2dAnimatedSprite;
private var anim: tk2dAnimatedSprite;
//----------------------------------------
//  Game-varying state
//----------------------------------------
private var health = 0;
private var state = "idle";

function Awake()
{
    anim = GetComponent(tk2dAnimatedSprite);
}

function Start ()
{
    collider.isTrigger = false;
}

function OnSpawn()
{
    state = "alive";
    health = kInitialHealth;
    // load whole anim
    this.anim.Play();
    this.anim.SetFrame(0);
    this.anim.Pause();
}

function Update()
{
    // update health bar state
    healthBarAnim.Play();
    var fraction = 1.0*health / kInitialHealth;
    healthBarAnim.SetFrame( Mathf.FloorToInt(39*fraction) );
    healthBarAnim.Pause();
}

function OnHitByBullet(bullet:Bullet)
{
    Debug.Log("tree hit!");
	health -= 1;

	if( health <= 0 )
    {
		state = "dead";
        Destroy(gameObject);
		//this.anim.Play();
	}
}

function GetBlocksBullets ()
{
	return state == "alive";
}
