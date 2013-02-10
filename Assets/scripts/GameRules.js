#pragma strict

var expandSound:AudioClip;

private var arena:Arena;
private var moneyPrefab:Money;
private var goldPrefab:Money;

private var statusText:TextMesh;

private var lastMoneySpawnTime = 0.0;
private var spawnMoneyPeriod = 1.0;
private var maxAvailMoneys = 5;

private var numExpands:int[] = [0,0,0,0];
private var expandToCost:int[] = [10, 15, 20, 25, 30];

private var moneys = new List.<Money>();
private var numMoneysSpawned = 0;

var debugCheapExpand = false;

private var state = "playing";

function Start ()
{
    arena = GameObject.Find("arena").GetComponent(Arena);
    moneyPrefab = GameObject.Find("moneyPrefab").GetComponent(Money);
    goldPrefab = GameObject.Find("goldPrefab").GetComponent(Money);
    statusText = GameObject.Find("gameStatusText").GetComponent(TextMesh);

    ResetGame();
}

function ResetGame()
{
    for( var i = 0; i < 4; i++ )
    {
        numExpands[i] = 0.0;
    }

    lastMoneySpawnTime = Time.time;
    numMoneysSpawned = 0;

    statusText.text = "";

    BroadcastMessage("OnResetGame");
}

function OnPlayerHitCityHall(player:Player, hall:CityHall)
{
    if( state == "playing" )
    {
        var pid = player.GetId();
        var n = numExpands[pid];

        if( n < expandToCost.length )
        {
            if( player.GetSafe().GetAmount() >= expandToCost[n] || debugCheapExpand )
            {
                player.GetSafe().AddMoney( -expandToCost[n] );
                arena.ExpandForPlayer(pid);
                numExpands[pid]++;
                AudioSource.PlayClipAtPoint( expandSound, player.gameObject.transform.position );
                Debug.Log("player " + pid + " expanded " + numExpands[pid]);

                if( numExpands[pid] == expandToCost.length )
                {
                    state = "gameover";
                    statusText.text = "PLAYER "+(player.GetId()+1)+" WINS!!!!\nR to restart";
                    BroadcastMessage("OnGameOver");
                }
            }
        }
    }
}

function Update ()
{
    if( Input.GetButtonDown("Reset") )
    {
        Application.LoadLevel( Application.loadedLevel );
    }

    //----------------------------------------
    //  Do money spawning
    //----------------------------------------

    if( Time.time-lastMoneySpawnTime > spawnMoneyPeriod )
    {
        lastMoneySpawnTime = Time.time;

        // count how many free moneys are on screen
        var numAvailMoneys = 0;

        for( var m in moneys )
        {
            if( m != null && !m.GetIsGrabbed() )
            {
                numAvailMoneys++;
            }
        }

        for( var num = numAvailMoneys; num < maxAvailMoneys; num++ )
        {
            var p = arena.GetRandomMoneyPosition(0.0);
            var prefab = moneyPrefab;

            if( numMoneysSpawned % 30 == 0 && numMoneysSpawned != 0 )
            {
                // spawn gold
                p = arena.GetRandomMoneyPosition(arena.GetWidth()*0.25);
                prefab = goldPrefab;
            }

            var inst = Instantiate( prefab, p, Quaternion.identity );
            moneys.Add(inst);
            numMoneysSpawned++;
        }

        // get rid of null moneys
        RemoveNulls( moneys );
    }
}

function OnBulletHit( bullet:Bullet, player:Player )
{
    if( bullet.GetOwner() != player )
    {
        if( player.GetIsTrespassingOn( bullet.GetOwner().GetId() ) )
        {
            bullet.OnHit(player);
            player.OnDamaged(1, bullet);
        }
    }
}

function OnPlayerDied( player:Player )
{
}

function GetExpansionCost( pid:int )
{
    if( numExpands[pid] < expandToCost.length )
    {
        return expandToCost[ numExpands[pid] ];
    }
    return 0;
}
