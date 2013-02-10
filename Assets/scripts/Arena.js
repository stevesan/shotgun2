#pragma strict

import System.Collections.Generic;

var map:TextAsset;

var publicTile:GameObject;
var wallBlock:GameObject;
var privateTiles:GameObject[];
private var cityhall:GameObject;
private var cityhallPrefab:GameObject;
private var players = new List.<GameObject>();
private var safes = new List.<GameObject>();

var mins = Vector2(0,0);
var maxs = Vector2(0,0);

var startX = 0.0;
var startY = 0.0;

private var tileRows = new List.< List.<GameObject> >();

function GetWidth() { return maxs.x - mins.x; }
function GetHeight() { return maxs.y - mins.y; }
function GetLeftX() { return mins.x; }
function GetBottomY() { return mins.y; }
function GetZ() { return transform.position.z; }

function GetPlayerPropertyCentroid( pid:int )
{
    var sumpos = Vector3(0,0,0);
    var numTiles = 0;

    for( var row:List.<GameObject> in tileRows )
    {
        for( var gobj:GameObject in row )
        {
            var tile = gobj.GetComponent(Tile);
            if( tile != null && tile.GetOwner() == pid )
            {
                sumpos += tile.transform.position;
                numTiles++;
            }
        }
    }

    return sumpos / numTiles;
}

class GridPos
{
    var row = -1;
    var col = -1;

    function GridPos( row:int, col:int )
    {
        this.row = row;
        this.col = col;
    }
}

function IsOwnedBy( pos:GridPos, pid:int, defaultVal:boolean ) : boolean
{
    if( pos.row < 0 || pos.row >= tileRows.Count )
    {
        return defaultVal;
    }

    var row = tileRows[pos.row];

    if( pos.col < 0 || pos.col >= row.Count )
    {
        return defaultVal;
    }

    var tile = row[pos.col].GetComponent(Tile);

    if( tile == null )
    {
        return defaultVal;
    }

    return tile.GetOwner() == pid;
}

function AreAnyNeighborsOwnedBy( pos:GridPos, pid:int )
{
    return
        IsOwnedBy( GridPos(pos.row-1, pos.col-1), pid, false )
        || IsOwnedBy( GridPos(pos.row-1, pos.col), pid, false )
        || IsOwnedBy( GridPos(pos.row-1, pos.col+1), pid, false )

        || IsOwnedBy( GridPos(pos.row, pos.col-1), pid, false )
        || IsOwnedBy( GridPos(pos.row, pos.col+1), pid, false )

        || IsOwnedBy( GridPos(pos.row+1, pos.col-1), pid, false )
        || IsOwnedBy( GridPos(pos.row+1, pos.col), pid, false )
        || IsOwnedBy( GridPos(pos.row+1, pos.col+1), pid, false );

}

function ExpandForPlayer(pid:int)
{
    var toExpandPosList = new List.<GridPos>();

    for( var row = 0; row < tileRows.Count; row++ )
    {
        var tileRow = tileRows[row];

        for( var col = 0; col < tileRow.Count; col++ )
        {
            var tile = tileRow[col].GetComponent(Tile);

            if( tile != null && tile.GetOwner() != pid )
            {
                if( AreAnyNeighborsOwnedBy( GridPos(row,col), pid ) )
                {
                    toExpandPosList.Add( GridPos(row,col) );
                }
            }
        }
    }

    for( var pos in toExpandPosList )
    {
        var oldObj = tileRows[pos.row][pos.col];
        var newTile = Instantiate( privateTiles[pid], oldObj.transform.position, oldObj.transform.rotation );
        newTile.GetComponent(Tile).SetOwner(pid);
        tileRows[pos.row][pos.col] = newTile;
        Destroy(oldObj);
    }
}

private function ExpandBounds( p:Vector3 )
{
    mins.x = Mathf.Min( mins.x, p.x );
    mins.y = Mathf.Min( mins.y, p.y );
    maxs.x = Mathf.Max( maxs.x, p.x );
    maxs.y = Mathf.Max( maxs.y, p.y );
}

function Start ()
{
    var inst:GameObject = null;

    //----------------------------------------
    //  Create tiles
    //----------------------------------------
    var bounds = publicTile.gameObject.GetComponent(MeshFilter).mesh.bounds;
    var width = bounds.size.x;
    var height = bounds.size.y;

    var mapstr = map.text;
    var nextX = startX;
    var nextY = startY+height;

    for( var i = 0; i < mapstr.Length-1; i++ )
    {
        var c = mapstr[i];
        var privateId = -1;
        var nextPos = Vector3(nextX, nextY, transform.position.z);
        var nextRot = Quaternion.identity;

        if( c == '\n' || i == 0 )
        {
            tileRows.Add( new List.<GameObject>() );
            nextY -= height;
            nextX = startX;
            nextPos = Vector3(nextX, nextY, transform.position.z);

            if( c == '\n' )
                continue;
        }

        if( c == 'p' )
        {
            tileRows[ tileRows.Count-1 ].Add( Instantiate(publicTile, nextPos, nextRot) );
            nextX += width;
            ExpandBounds(nextPos);
        }
        else if( c == 'w' )
        {
            tileRows[ tileRows.Count-1 ].Add( Instantiate(wallBlock, nextPos, nextRot) );
            nextX += width;
        }
        else if( int.TryParse(c+"", privateId) && privateId < 4 )
        {
            inst = Instantiate(privateTiles[privateId], nextPos, nextRot);
            inst.GetComponent(Tile).SetOwner( privateId );
            tileRows[ tileRows.Count-1 ].Add( inst );
            nextX += width;
            ExpandBounds(nextPos);
        }
    }

    //----------------------------------------
    //  Create and position players
    //----------------------------------------

    var playerPrefab = GameObject.Find("playerPrefab");
    var safePrefab = GameObject.Find("safePrefab");

    for( var pid = 0; pid < 4; pid++ )
    {
        var pos = GetPlayerPropertyCentroid(pid);
        pos.z -= 0.02;
        var playerInst = Instantiate( playerPrefab, pos, Quaternion.identity );
        playerInst.GetComponent(Player).SetId(pid);
        playerInst.GetComponent(Player).OnStartGame();
        players.Add(playerInst);

        // create safe
        pos.z += 0.01;
        var safeInst = Instantiate( safePrefab, pos, Quaternion.identity );
        safeInst.GetComponent(Safe).OnStartGame(playerInst.GetComponent(Player));
        safes.Add( safeInst );

        playerInst.GetComponent(Player).SetSafe(safeInst.GetComponent(Safe));
    }

    //----------------------------------------
    //  create city hall
    //----------------------------------------

    var cityhallPrefab = GameObject.Find("cityhallPrefab");
    cityhall = Instantiate( cityhallPrefab, (mins+maxs)*0.5, Quaternion.identity );
}

function Update () {

}

function GetIsMoneyPositionOK(p:Vector3)
{
    var bounds = cityhall.GetComponent(MeshFilter).mesh.bounds;

    return p.x >= bounds.max.x
        || p.x <= bounds.min.x
        || p.y >= bounds.max.y
        || p.y <= bounds.min.y;
}

function GetRandomMoneyPosition(margin:float)
{
    var p = Vector3(
            GetLeftX()+margin + Random.value * (GetWidth()-2*margin),
            GetBottomY()+margin + Random.value * (GetHeight()-2*margin),
            GetZ()-0.1 );

    while( !GetIsMoneyPositionOK(p) )
    {
        p = Vector3(
            GetLeftX()+margin + Random.value * (GetWidth()-2*margin),
            GetBottomY()+margin + Random.value * (GetHeight()-2*margin),
            GetZ()-0.1 );
    }
    return p;
}
