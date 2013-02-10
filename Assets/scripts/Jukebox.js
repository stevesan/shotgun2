#pragma strict

var tracks:AudioClip[];
var winMusic:AudioClip;
var currTrack = 0;

function Start () {

}

function Update () {

}

function OnResetGame()
{
    currTrack = Mathf.FloorToInt(Random.value*tracks.length) % tracks.length;
    GetComponent(AudioSource).clip = tracks[currTrack];
    GetComponent(AudioSource).Play();
}

function OnGameOver()
{
    GetComponent(AudioSource).clip = winMusic;
    GetComponent(AudioSource).Play();
}
