var t=Object.defineProperty,e=(e,s,i)=>((e,s,i)=>s in e?t(e,s,{enumerable:!0,configurable:!0,writable:!0,value:i}):e[s]=i)(e,"symbol"!=typeof s?s+"":s,i);import{p as s}from"./phaser-DM0uoNMb.js";!function(){const t=document.createElement("link").relList;if(!(t&&t.supports&&t.supports("modulepreload"))){for(const t of document.querySelectorAll('link[rel="modulepreload"]'))e(t);new MutationObserver((t=>{for(const s of t)if("childList"===s.type)for(const t of s.addedNodes)"LINK"===t.tagName&&"modulepreload"===t.rel&&e(t)})).observe(document,{childList:!0,subtree:!0})}function e(t){if(t.ep)return;t.ep=!0;const e=function(t){const e={};return t.integrity&&(e.integrity=t.integrity),t.referrerPolicy&&(e.referrerPolicy=t.referrerPolicy),"use-credentials"===t.crossOrigin?e.credentials="include":"anonymous"===t.crossOrigin?e.credentials="omit":e.credentials="same-origin",e}(t);fetch(t.href,e)}}();class i extends s.Scene{constructor(){super("Boot")}preload(){}create(){this.scene.start("Preloader")}}class a extends s.Scene{constructor(){super({key:"FadeTransition"})}create({targetScene:t,targetMap:e,playerPosition:s,fadeColor:i=0,duration:a=500}){const n=this.add.rectangle(0,0,this.scale.width,this.scale.height,i);n.setOrigin(0,0),n.setAlpha(0),this.tweens.add({targets:n,alpha:1,duration:a/2,onComplete:()=>{this.scene.start(t,{targetMap:e,playerPosition:s}),this.tweens.add({targets:n,alpha:0,duration:a/2,onComplete:()=>{this.scene.remove(this)}})}})}}class n{constructor(t,s){e(this,"scene"),e(this,"mainCamera"),e(this,"target",null),this.scene=t,this.mainCamera=t.cameras.main,this.setupCamera(s)}setupCamera(t){if(null==t?void 0:t.bounds){const e=Math.max(0,(this.scene.scale.width-t.bounds.width)/2),s=Math.max(0,(this.scene.scale.height-t.bounds.height)/2);this.mainCamera.setBounds(0,0,t.bounds.width,t.bounds.height),this.mainCamera.setViewport(e,s,Math.min(this.scene.scale.width,t.bounds.width),Math.min(this.scene.scale.height,t.bounds.height))}(null==t?void 0:t.deadzone)&&this.mainCamera.setDeadzone(t.deadzone.width,t.deadzone.height),(null==t?void 0:t.lerp)&&this.mainCamera.setLerp(t.lerp)}startFollow(t){this.target=t,this.mainCamera.startFollow(t)}stopFollow(){this.target=null,this.mainCamera.stopFollow()}shake(t,e=.05){this.mainCamera.shake(t,e)}fade(t=1e3,e=0){return new Promise((s=>{this.mainCamera.fadeOut(t,e),this.mainCamera.once("camerafadeoutcomplete",s)}))}fadeIn(t=1e3,e=0){return new Promise((s=>{this.mainCamera.fadeIn(t,e),this.mainCamera.once("camerafadeincomplete",s)}))}}const r={shroom:{key:"shroom",name:"Mushroom",stackable:!0,maxStack:99,sprite:"shroom",scale:.5,consumable:!0,effects:[{type:"health",value:20}]}};class h{constructor(t=10){e(this,"slots"),this.slots=Array(t).fill(null).map((()=>({itemKey:null,count:0})))}addItem(t,e=1){const s=r[t];if(!s)return!1;if(s.stackable){const i=this.slots.find((e=>e.itemKey===t&&e.count<s.maxStack));if(i){const t=s.maxStack-i.count,a=Math.min(e,t);if(i.count+=a,0==(e-=a))return!0}}const i=this.slots.find((t=>null===t.itemKey));return!!i&&(i.itemKey=t,i.count=e,!0)}removeItem(t,e=1){const s=this.slots[t];if(!s||!s.itemKey||s.count<e)return null;const i=s.itemKey;return s.count-=e,s.count<=0&&(s.itemKey=null,s.count=0),i}getSlots(){return this.slots}getItemData(t){const e=this.slots[t];return e.itemKey?r[e.itemKey]:null}}class o{constructor(t,s,i){e(this,"scene"),e(this,"sprite"),this.scene=t,this.sprite=t.physics.add.sprite(s,i,"player"),this.sprite.setCollideWorldBounds(!0),this.createAnimations()}createAnimations(){this.scene.anims.exists("left")||this.scene.anims.create({key:"left",frames:this.scene.anims.generateFrameNumbers("player",{start:0,end:3}),frameRate:10,repeat:-1}),this.scene.anims.exists("turn")||this.scene.anims.create({key:"turn",frames:[{key:"player",frame:4}],frameRate:20}),this.scene.anims.exists("right")||this.scene.anims.create({key:"right",frames:this.scene.anims.generateFrameNumbers("player",{start:5,end:8}),frameRate:10,repeat:-1})}getSprite(){return this.sprite}destroy(){this.sprite.destroy()}}class l extends Phaser.GameObjects.Container{constructor(t,s,i,a){super(t,s,i),e(this,"itemKey"),e(this,"sprite"),this.itemKey=a;const n=r[a];this.sprite=t.add.sprite(0,0,n.sprite),this.sprite.setDisplaySize(32,32),this.sprite.setOrigin(-.5),this.add(this.sprite),t.add.existing(this),t.physics.add.existing(this,!1),t.tweens.add({targets:this,y:i-5,duration:1e3,yoyo:!0,repeat:-1})}getItemKey(){return this.itemKey}}class c extends o{constructor(t,s,i,a){super(t,s,i),e(this,"cursors"),e(this,"inventory"),e(this,"uiManager"),e(this,"interactKey"),e(this,"dropKey"),e(this,"useKey"),e(this,"maxHealth",100),e(this,"currentHealth",100),this.uiManager=a,this.inventory=new h(10),t.input.keyboard&&(this.cursors=t.input.keyboard.createCursorKeys(),this.interactKey=t.input.keyboard.addKey("E"),this.dropKey=t.input.keyboard.addKey("Q"),this.useKey=t.input.keyboard.addKey("F")),this.setupItemInteraction(),this.updateUI(),t.events.on("playerDamaged",this.damage,this)}update(){this.cursors&&this.sprite.body&&(this.cursors.left.isDown?(this.sprite.setVelocityX(-160),this.sprite.anims.play("left",!0)):this.cursors.right.isDown?(this.sprite.setVelocityX(160),this.sprite.anims.play("right",!0)):(this.sprite.setVelocityX(0),this.sprite.anims.play("turn")),this.cursors.up.isDown?this.sprite.setVelocityY(-160):this.cursors.down.isDown?this.sprite.setVelocityY(160):this.sprite.setVelocityY(0))}getVelocity(){var t;return(null==(t=this.sprite.body)?void 0:t.velocity)??new Phaser.Math.Vector2}updateUI(){this.uiManager.updateHealthBar(this.currentHealth,this.maxHealth),this.updateInventoryUI()}setHealth(t){this.currentHealth=Math.max(0,Math.min(this.maxHealth,t)),this.updateUI(),this.currentHealth<=0&&this.onDeath()}heal(t){this.setHealth(this.currentHealth+t)}damage(t){this.setHealth(this.currentHealth-t)}onDeath(){console.log("Player died!")}setupItemInteraction(){this.interactKey.on("down",(()=>this.tryPickupItem())),this.dropKey.on("down",(()=>this.tryDropItem())),this.useKey.on("down",(()=>this.tryUseItem()))}tryPickupItem(){const t=this.scene.physics.overlapCirc(this.sprite.x,this.sprite.y,32);for(const e of t)if(e.gameObject instanceof l){const t=e.gameObject,s=t.getItemKey();if(this.inventory.addItem(s)){t.destroy(),this.updateInventoryUI();break}}this.damage(10)}tryDropItem(){const t=this.uiManager.getInventoryUI().getSelectedSlot(),e=this.inventory.removeItem(t,1);if(e){const t=40*Math.random()-20,s=40*Math.random()-20;new l(this.scene,this.sprite.x+t,this.sprite.y+s,e),this.updateInventoryUI()}}tryUseItem(){const t=this.uiManager.getInventoryUI().getSelectedSlot(),e=this.inventory.getSlots()[t];if(e.itemKey){const s=r[e.itemKey];if(s.consumable&&s.effects){let e=!1;for(const t of s.effects)"health"===t.type&&this.currentHealth<this.maxHealth&&(this.heal(t.value),e=!0);e&&(this.inventory.removeItem(t,1),this.updateInventoryUI())}}}updateInventoryUI(){const t=this.uiManager.getInventoryUI();this.inventory.getSlots().forEach(((e,s)=>{e.itemKey?t.setItem(s,e.itemKey,e.count):t.setItem(s,"",0)}))}destroy(){super.destroy(),this.interactKey.destroy(),this.dropKey.destroy(),this.useKey.destroy()}}class d{constructor(t,s){e(this,"scene"),e(this,"sprite"),e(this,"damage"),e(this,"speed"),e(this,"canAttack"),e(this,"moveDelay"),e(this,"isMoving",!1),e(this,"moveTimer"),e(this,"target"),e(this,"detectionRadius"),e(this,"hasDetectedPlayer",!1),this.scene=t,this.damage=s.damage||10,this.speed=s.speed||50,this.canAttack=s.canAttack??!0,this.moveDelay=s.moveDelay||0,this.detectionRadius=s.detectionRadius||200,this.sprite=t.physics.add.sprite(s.x,s.y,"player"),this.sprite.setCollideWorldBounds(!0),this.createAnimations(),this.startMovementCycle()}createAnimations(){this.scene.anims.exists("enemy-left")||this.scene.anims.create({key:"enemy-left",frames:this.scene.anims.generateFrameNumbers("player",{start:0,end:3}),frameRate:10,repeat:-1}),this.scene.anims.exists("enemy-right")||this.scene.anims.create({key:"enemy-right",frames:this.scene.anims.generateFrameNumbers("player",{start:5,end:8}),frameRate:10,repeat:-1}),this.scene.anims.exists("enemy-idle")||this.scene.anims.create({key:"enemy-idle",frames:[{key:"player",frame:4}],frameRate:1})}startMovementCycle(){0!==this.moveDelay?(this.moveTimer=this.scene.time.addEvent({delay:this.moveDelay,callback:()=>{this.isMoving?this.stopMoving():this.startMoving()},loop:!0}),this.startMoving()):this.startMoving()}isPlayerDetected(){return!!this.target&&(!!this.hasDetectedPlayer||Phaser.Math.Distance.Between(this.sprite.x,this.sprite.y,this.target.x,this.target.y)<=this.detectionRadius&&(this.hasDetectedPlayer=!0,!0))}startMoving(){this.isMoving=!0,this.target&&(console.log(this.isPlayerDetected()),this.isPlayerDetected()?this.moveTowardsTarget():this.moveRandomly())}stopMoving(){this.isMoving=!1,this.sprite.setVelocity(0,0),this.sprite.play("enemy-idle")}moveTowardsTarget(){var t,e,s,i,a,n,r,h,o,l;if(!this.target||!this.isMoving)return;if((null==(t=this.sprite.body)?void 0:t.blocked.up)||(null==(e=this.sprite.body)?void 0:e.blocked.down)||(null==(s=this.sprite.body)?void 0:s.blocked.left)||(null==(i=this.sprite.body)?void 0:i.blocked.right)){const t=this.target.x-this.sprite.x,e=this.target.y-this.sprite.y;let s=Math.atan2(e,t);((null==(a=this.sprite.body)?void 0:a.blocked.left)&&t<0||(null==(n=this.sprite.body)?void 0:n.blocked.right)&&t>0)&&(s=e>0?Math.PI/4:-Math.PI/4),((null==(r=this.sprite.body)?void 0:r.blocked.up)&&e<0||(null==(h=this.sprite.body)?void 0:h.blocked.down)&&e>0)&&(s=t>0?-Math.PI/4:Math.PI/4),this.sprite.setVelocityX(Math.cos(s)*this.speed),this.sprite.setVelocityY(Math.sin(s)*this.speed)}else{const t=this.target.x-this.sprite.x,e=this.target.y-this.sprite.y,s=Math.atan2(e,t);this.sprite.setVelocityX(Math.cos(s)*this.speed),this.sprite.setVelocityY(Math.sin(s)*this.speed)}const c=(null==(o=this.sprite.body)?void 0:o.velocity.x)??0;Math.abs(c)>Math.abs((null==(l=this.sprite.body)?void 0:l.velocity.y)??0)&&this.sprite.play(c>0?"enemy-right":"enemy-left",!0)}moveRandomly(){var t,e,s,i,a,n,r,h,o;if(this.isMoving&&((null==(t=this.sprite.body)?void 0:t.blocked.up)||(null==(e=this.sprite.body)?void 0:e.blocked.down)||(null==(s=this.sprite.body)?void 0:s.blocked.left)||(null==(i=this.sprite.body)?void 0:i.blocked.right)||0===(null==(a=this.sprite.body)?void 0:a.velocity.length()))){let t=Math.random()*Math.PI*2;(null==(n=this.sprite.body)?void 0:n.blocked.left)?t=Math.random()*Math.PI-Math.PI/2:(null==(r=this.sprite.body)?void 0:r.blocked.right)?t=Math.random()*Math.PI+Math.PI/2:(null==(h=this.sprite.body)?void 0:h.blocked.up)?t=Math.random()*Math.PI:(null==(o=this.sprite.body)?void 0:o.blocked.down)&&(t=Math.random()*Math.PI+Math.PI),this.sprite.setVelocityX(Math.cos(t)*this.speed),this.sprite.setVelocityY(Math.sin(t)*this.speed);const e=Math.cos(t);Math.abs(e)>Math.abs(Math.sin(t))&&this.sprite.play(e>0?"enemy-right":"enemy-left",!0)}}setTarget(t){this.target=t}update(){}getSprite(){return this.sprite}handlePlayerCollision(t){this.canAttack&&this.scene.events.emit("playerDamaged",this.damage)}destroy(){this.moveTimer&&this.moveTimer.destroy(),this.sprite.destroy()}}class p{constructor(t){e(this,"scene"),e(this,"enemies",[]),e(this,"playerSprite"),this.scene=t}createEnemiesFromMap(t){const e=t.getObjectLayer("Enemies");e?e.objects.forEach((t=>{var e,s,i,a,n,r,h,o;const l=new d(this.scene,{x:t.x||0,y:t.y||0,damage:(null==(s=null==(e=t.properties)?void 0:e.find((t=>"damage"===t.name)))?void 0:s.value)||10,speed:(null==(a=null==(i=t.properties)?void 0:i.find((t=>"speed"===t.name)))?void 0:a.value)||30,canAttack:(null==(r=null==(n=t.properties)?void 0:n.find((t=>"canAttack"===t.name)))?void 0:r.value)??!0,moveDelay:(null==(o=null==(h=t.properties)?void 0:h.find((t=>"moveDelay"===t.name)))?void 0:o.value)||2e3});this.playerSprite&&l.setTarget(this.playerSprite),this.enemies.push(l)})):console.warn("No enemy layer found in the map")}setPlayerTarget(t){this.playerSprite=t,this.enemies.forEach((e=>e.setTarget(t)))}setupCollisions(t,e){this.setPlayerTarget(t),this.enemies.forEach((s=>{this.scene.physics.add.overlap(t,s.getSprite(),(()=>s.handlePlayerCollision(t))),e.forEach((t=>{this.scene.physics.add.collider(s.getSprite(),t)})),this.enemies.forEach((t=>{s!==t&&this.scene.physics.add.collider(s.getSprite(),t.getSprite())}))}))}update(){this.enemies.forEach((t=>t.update()))}destroy(){this.enemies.forEach((t=>t.destroy())),this.enemies=[]}}class u{constructor(t,s,i,a,n,r){e(this,"scene"),e(this,"trigger"),e(this,"transitionData"),e(this,"isTransitioning",!1),this.scene=t,this.transitionData=r,this.trigger=t.add.zone(s,i,a,n),t.physics.world.enable(this.trigger);const h=this.trigger.body;h.setAllowGravity(!1),h.moves=!1}addOverlapWith(t,e){this.scene.physics.add.overlap(t,this.trigger,(()=>{this.isTransitioning||(this.isTransitioning=!0,this.handleTransition(e))}),void 0,this)}handleTransition(t){this.scene.scene.launch("FadeTransition",{targetScene:"Game",targetMap:this.transitionData.targetMap,playerPosition:this.transitionData.playerPosition,fadeColor:this.transitionData.fadeColor,duration:this.transitionData.duration}),t&&t()}}class g{constructor(t){e(this,"scene"),e(this,"transitions",[]),this.scene=t}loadFromTiledLayer(t){console.log("Loading transitions from layer:",t);for(const e of t.objects){const t=e,s=this.parseTransitionProperties(t);if(s){const e=new u(this.scene,t.x+t.width/2,t.y+t.height/2,t.width,t.height,s);this.transitions.push(e)}}}parseTransitionProperties(t){if(!t.properties)return null;const e=e=>{var s;const i=null==(s=t.properties)?void 0:s.find((t=>t.name===e));return i?i.value:void 0},s=e("targetMap"),i=e("targetX"),a=e("targetY"),n=e("fadeColor")||0,r=e("duration")||500;return s&&void 0!==i&&void 0!==a?{targetMap:s,playerPosition:{x:i,y:a},fadeColor:n,duration:r}:(console.warn("Transition object missing required properties:",t),null)}setupPlayerTransitions(t){this.transitions.forEach((e=>{e.addOverlapWith(t)}))}destroy(){this.transitions=[]}}class y{constructor(t){e(this,"scene"),e(this,"map"),e(this,"tilesets"),e(this,"layers"),e(this,"transitionManager"),e(this,"currentMapId"),e(this,"isLoading"),this.scene=t,this.map=null,this.tilesets=new Map,this.layers=new Map,this.transitionManager=new g(t),this.currentMapId=null,this.isLoading=!1}preload(){this.scene.load.image("tiles","assets/tilesets/rpg_tileset.png"),this.scene.load.image("tiles2","assets/tilesets/hyptosis_tiles_1.png")}async loadMap(t){if(this.isLoading)throw new Error("Map is already loading");try{if(this.isLoading=!0,this.destroy(),this.scene.cache.tilemap.exists(t)||(this.scene.load.tilemapTiledJSON(t,`assets/maps/${t}.tmj`),await new Promise((t=>{this.scene.load.once("complete",(()=>t())),this.scene.load.start()}))),this.map=this.scene.make.tilemap({key:t}),!this.map)throw new Error("Failed to create tilemap");const e=this.map.addTilesetImage("Ground","tiles"),s=this.map.addTilesetImage("hyptosis_tiles_1","tiles2");if(!e||!s)throw new Error("Failed to load tilesets");const i=this.map.createLayer("Tile Layer 1",[e,s],0,0);i&&(i.setCollisionByProperty({collides:!0}),this.layers.set("Tile Layer 1",i)),await this.loadTransitions(),this.currentMapId=t}catch(e){throw this.destroy(),console.error("Error loading map:",e),e}finally{this.isLoading=!1}}getLayer(t){return this.layers.get(t)}getLayers(){return this.layers}getCollisionLayers(){return Array.from(this.layers.values()).filter((t=>t.collisionMask))}async loadTransitions(){if(!this.map)return;const t=this.map.getObjectLayer("Transitions");t&&this.transitionManager.loadFromTiledLayer(t)}setupPlayerTransitions(t){this.transitionManager.setupPlayerTransitions(t)}getCurrentMapId(){return this.currentMapId}getCurrentMap(){return this.map}getMapBounds(){return this.map?{width:this.map.widthInPixels,height:this.map.heightInPixels}:null}destroy(){this.layers.forEach((t=>t.destroy())),this.layers.clear(),this.tilesets.clear(),this.map&&this.map.destroy(),this.map=null,this.currentMapId=null}}class m{constructor(t){e(this,"scene"),e(this,"container"),this.scene=t,this.container=this.scene.add.container(0,0)}getContainer(){return this.container}}class f extends m{constructor(t,s,i){super(t),e(this,"background"),e(this,"messagesText"),e(this,"inputBox"),e(this,"inputText"),e(this,"messages",[]),e(this,"config"),e(this,"isInputActive",!1),e(this,"currentInput",""),e(this,"webSocketService"),this.webSocketService=i,this.config={maxMessages:50,fontSize:16,padding:10,x:10,y:t.scale.height-s.height-10,...s},this.createChatUI(),this.setupInputHandling(),this.webSocketService.onChatMessage(((t,e)=>{this.addMessage(`Player ${t}: ${e}`)}))}createChatUI(){this.container.setPosition(this.config.x,this.config.y),this.background=this.scene.add.rectangle(0,0,this.config.width,this.config.height,0,.5).setOrigin(0,0),this.messagesText=this.scene.add.text(this.config.padding,this.config.padding,"",{fontSize:`${this.config.fontSize}px`,color:"#ffffff",wordWrap:{width:this.config.width-2*this.config.padding}}).setOrigin(0,0),this.inputBox=this.scene.add.rectangle(0,this.config.height-30,this.config.width,30,3355443).setOrigin(0,0),this.inputText=this.scene.add.text(this.config.padding,this.config.height-25,"",{fontSize:`${this.config.fontSize}px`,color:"#ffffff"}).setOrigin(0,0),this.container.add([this.background,this.messagesText,this.inputBox,this.inputText]),this.inputBox.setInteractive({useHandCursor:!0}).on("pointerdown",(()=>{this.activateInput()}))}setupInputHandling(){var t;null==(t=this.scene.input.keyboard)||t.on("keydown",(t=>{this.isInputActive&&("Enter"===t.key?this.sendMessage():"Escape"===t.key?this.deactivateInput():"Backspace"===t.key?(this.currentInput=this.currentInput.slice(0,-1),this.updateInputText()):1===t.key.length&&(this.currentInput+=t.key,this.updateInputText()))}))}activateInput(){this.isInputActive=!0,this.inputBox.setFillStyle(4473924)}deactivateInput(){this.isInputActive=!1,this.currentInput="",this.updateInputText(),this.inputBox.setFillStyle(3355443)}updateInputText(){this.inputText.setText(this.currentInput)}sendMessage(){if(this.currentInput.trim()){const t=this.scene.data.get("currentMapId")||"map5";console.log(t),this.webSocketService.sendMessage(this.currentInput,t),this.addMessage(`You: ${this.currentInput}`),this.currentInput="",this.updateInputText()}this.deactivateInput()}addMessage(t){this.messages.push(t),this.messages.length>this.config.maxMessages&&this.messages.shift(),this.updateMessages()}updateMessages(){this.messagesText.setText(this.messages.join("\n"))}handleResize(t){this.container.setPosition(this.config.x,t.height-this.config.height-10)}destroy(){var t;this.container.destroy(),null==(t=this.scene.input.keyboard)||t.off("keydown")}}class v{constructor(t){e(this,"scene"),e(this,"healthBar"),this.scene=t,this.healthBar=t.add.graphics(),this.healthBar.setScrollFactor(0,0)}update(t,e){this.healthBar.clear(),this.healthBar.fillStyle(0,.5),this.healthBar.fillRect(10,10,104,12);const s=t/e;this.healthBar.fillStyle(16711680,1),this.healthBar.fillRect(12,12,100*s,8)}getContainer(){return this.healthBar}destroy(){this.healthBar.destroy()}}class M extends m{constructor(t,s={}){super(t),e(this,"config"),e(this,"slots",[]),e(this,"selectedSlotIndex",0),e(this,"background");const i=this.scene.cameras.getCamera("uiCamera");if(!i)throw"No Camera";const a=(s.slots||10)*(s.slotSize||48)+((s.slots||12)-1)*(s.spacing||4)+2*(s.padding||8),n=(s.slotSize||48)+2*(s.padding||8);this.config={slots:10,slotSize:48,padding:8,spacing:4,x:(null==i?void 0:i.width)-a-10,y:(null==i?void 0:i.height)-n-10,...s},this.createInventoryUI(),this.setupKeyboardControls()}createInventoryUI(){const t=this.config.slots*this.config.slotSize+(this.config.slots-1)*this.config.spacing+2*this.config.padding,e=this.config.slotSize+2*this.config.padding;this.background=this.scene.add.rectangle(0,0,t,e,0,.4).setOrigin(0,0),this.container.add(this.background),this.container.setPosition(this.config.x,this.config.y);for(let s=0;s<this.config.slots;s++){const t=this.createSlot(s);this.slots.push(t),this.container.add(t.container)}this.selectSlot(0)}createSlot(t){const e=this.config.padding+t*(this.config.slotSize+this.config.spacing),s=this.config.padding,i=this.scene.add.container(e,s),a=this.scene.add.rectangle(0,0,this.config.slotSize,this.config.slotSize,12886692,.5).setOrigin(0,0);return i.add(a),{container:i,background:a,index:t}}setupKeyboardControls(){var t;for(let e=1;e<=Math.min(9,this.config.slots);e++)null==(t=this.scene.input.keyboard)||t.on(`keydown-${e}`,(()=>{this.selectSlot(e-1)}))}selectSlot(t){this.deselectSlots(),this.selectedSlotIndex=t,this.slots[t].background.setStrokeStyle(2,16777215)}deselectSlots(){this.slots[this.selectedSlotIndex].background.setStrokeStyle()}setItem(t,e,s=1){if(t<0||t>=this.slots.length)return;const i=this.slots[t];i.item&&(i.item.destroy(),i.item=void 0),i.count&&(i.count.destroy(),i.count=void 0),e&&(i.item=this.scene.add.sprite(4,4,e).setOrigin(0,0).setDisplaySize(this.config.slotSize-8,this.config.slotSize-8),i.container.add(i.item),s>1&&(i.count=this.scene.add.text(this.config.slotSize-2,this.config.slotSize-2,s.toString(),{fontSize:"12px",color:"#ffffff",stroke:"#000000",strokeThickness:4}).setOrigin(1,1),i.container.add(i.count)))}getSelectedSlot(){return this.selectedSlotIndex}handleResize(t){const e=this.scene.cameras.getCamera("uiCamera");if(!e)return;const s=(null==e?void 0:e.width)-this.background.width-10,i=(null==e?void 0:e.height)-this.background.height-10;this.container.setPosition(s,i)}destroy(){var t;null==(t=this.scene.input.keyboard)||t.off("keydown"),this.container.destroy()}}class w{constructor(t,s){e(this,"scene"),e(this,"uiCamera"),e(this,"uiContainer"),e(this,"config"),e(this,"healthBarUI"),e(this,"inventoryUI"),e(this,"chatUI",null),this.scene=t,this.config=s,this.uiContainer=this.scene.add.container(0,0),this.uiContainer.setScrollFactor(0);const{xMargin:i,yMargin:a,viewportWidth:n,viewportHeight:r}=this.calculateViewportDimensions();this.uiCamera=this.scene.cameras.add(i,a,n,r),this.uiCamera.setName("uiCamera"),this.healthBarUI=new v(t),this.inventoryUI=new M(t),this.uiContainer.add([this.healthBarUI.getContainer(),this.inventoryUI.getContainer()]),this.updateCameraIgnoreList(),this.scene.cameras.main.ignore([this.uiContainer]),this.scene.scale.on("resize",this.handleResize,this)}initializeChatUI(t){this.chatUI=new f(this.scene,{width:300,height:200},t),this.uiContainer.add(this.chatUI.getContainer())}calculateViewportDimensions(){var t,e,s,i;const a=(null==(e=null==(t=this.config)?void 0:t.bounds)?void 0:e.width)??this.scene.scale.width,n=(null==(i=null==(s=this.config)?void 0:s.bounds)?void 0:i.height)??this.scene.scale.height;return{xMargin:Math.max(0,(this.scene.scale.width-a)/2),yMargin:Math.max(0,(this.scene.scale.height-n)/2),viewportWidth:Math.min(this.scene.scale.width,a),viewportHeight:Math.min(this.scene.scale.height,n)}}handleResize(t){var e;const{xMargin:s,yMargin:i,viewportWidth:a,viewportHeight:n}=this.calculateViewportDimensions();this.uiCamera.setViewport(s,i,a,n),null==(e=this.chatUI)||e.handleResize(t),this.inventoryUI.handleResize(t)}updateCameraIgnoreList(){this.uiCamera.ignore(this.scene.children.list.filter((t=>t!==this.uiContainer&&(Phaser.GameObjects.Sprite,!0))))}getUIContainer(){return this.uiContainer}getUICamera(){return this.uiCamera}getInventoryUI(){return this.inventoryUI}updateHealthBar(t,e){this.healthBarUI.update(t,e)}updateIgnoreList(){this.updateCameraIgnoreList()}destroy(){this.uiCamera.destroy(),this.uiContainer.destroy(),this.scene.scale.off("resize",this.handleResize)}}class I extends o{constructor(t,e,s){super(t,e,s)}moveTo(t,e){this.scene.tweens.add({targets:this.sprite,x:t,y:e,duration:100,ease:"Linear"})}update(){}}class b{constructor(t,s){e(this,"socket"),e(this,"scene"),e(this,"otherPlayers"),e(this,"messageHandlers",[]),e(this,"uiManager"),this.scene=t,this.otherPlayers=new Map,this.uiManager=s;const i=Math.floor(100*Math.random()).toString();this.socket=new WebSocket(`ws://localhost:8080/game?id=${i}`),this.setupSocketListeners()}setupSocketListeners(){this.socket.onmessage=t=>{const[e,s,...i]=t.data.split("|");switch(e){case"join":this.handlePlayerJoin(s,parseFloat(i[0]),parseFloat(i[1]));break;case"chat":this.handleChatMessage(s,i[0]);break;case"move":this.handlePlayerMove(s,parseFloat(i[0]),parseFloat(i[1]));break;case"leave":this.handlePlayerLeave(s)}}}handlePlayerJoin(t,e,s){if(!this.otherPlayers.has(t)){const i=new I(this.scene,e,s);this.otherPlayers.set(t,i),this.uiManager.updateIgnoreList()}}handlePlayerMove(t,e,s){if(!this.otherPlayers.has(t))return void this.handlePlayerJoin(t,e,s);const i=this.otherPlayers.get(t);i&&i.moveTo(e,s)}handlePlayerLeave(t){const e=this.otherPlayers.get(t);e&&(e.destroy(),this.otherPlayers.delete(t))}handleChatMessage(t,e){this.messageHandlers.forEach((s=>s(t,e)))}onChatMessage(t){this.messageHandlers.push(t)}offChatMessage(t){const e=this.messageHandlers.indexOf(t);e>-1&&this.messageHandlers.splice(e,1)}sendPosition(t,e,s){this.socket.readyState===WebSocket.OPEN&&this.socket.send(`move|${t}|${e}|${s}`)}sendMessage(t,e){this.socket.readyState===WebSocket.OPEN&&this.socket.send(`chat|${t}|${e}`)}initializeConnection(t,e,s){this.socket.readyState===WebSocket.OPEN?this.socket.send(`join|${t}|${e}|${s}`):this.socket.onopen=()=>{this.socket.send(`join|${t}|${e}|${s}`)}}destroy(){this.socket.close(),this.otherPlayers.forEach((t=>t.destroy())),this.otherPlayers.clear(),this.messageHandlers=[]}}class k extends s.Scene{constructor(){super("Game"),e(this,"webSocketService"),e(this,"cameraController"),e(this,"mapManager"),e(this,"player"),e(this,"uiManager"),e(this,"worldItems",[]),e(this,"enemyManager")}preload(){this.load.spritesheet("player","https://labs.phaser.io/assets/sprites/dude.png",{frameWidth:32,frameHeight:48}),this.load.image("shroom","https://p.novaskin.me/3123273216.png"),this.mapManager=new y(this),this.mapManager.preload()}async create(){const t=this.scene.settings.data;await this.mapManager.loadMap((null==t?void 0:t.targetMap)||"map5");const e=this.mapManager.getMapBounds();if(e){const s=(null==t?void 0:t.playerPosition)||{x:this.scale.width<e.width?this.scale.width/2:e.width/2,y:this.scale.height<e.height?this.scale.height/2:e.height/2};this.uiManager=new w(this,{bounds:{width:e.width,height:e.height}}),this.player=new c(this,s.x,s.y,this.uiManager),this.enemyManager=new p(this),this.enemyManager.createEnemiesFromMap(this.mapManager.getCurrentMap()),this.enemyManager.setupCollisions(this.player.getSprite(),this.mapManager.getCollisionLayers()),this.webSocketService=new b(this,this.uiManager),this.webSocketService.initializeConnection(s.x,s.y,"map5"),this.uiManager.initializeChatUI(this.webSocketService),this.createTestItems(),this.uiManager.updateIgnoreList(),this.mapManager.setupPlayerTransitions(this.player.getSprite()),this.mapManager.getCollisionLayers().forEach((t=>{this.physics.add.collider(this.player.getSprite(),t)}));const i={lerp:.1,bounds:{x:0,y:0,width:e.width,height:e.height}};this.cameraController=new n(this,i),this.cameraController.startFollow(this.player.getSprite()),this.scale.on("resize",(t=>{this.cameraController.setupCamera(i)})),this.physics.world.setBounds(-32,-32,e.width+64,e.height+64)}}update(){var t,e;if(null==(t=this.player)||t.update(),null==(e=this.enemyManager)||e.update(),this.player&&(0!==this.player.getVelocity().x||0!==this.player.getVelocity().y)){const t=this.player.getSprite();console.log(t.x,t.y),this.webSocketService.sendPosition(t.x,t.y,this.mapManager.getCurrentMapId())}}createTestItems(){[{x:100,y:100},{x:200,y:150},{x:300,y:200}].forEach((t=>{const e=new l(this,t.x,t.y,"shroom");this.worldItems.push(e)}))}destroy(){var t,e;null==(t=this.webSocketService)||t.destroy(),null==(e=this.enemyManager)||e.destroy()}}class S extends s.Scene{constructor(){super("MainMenu"),e(this,"title")}create(){this.title=this.add.text(this.scale.width/2,this.scale.height/2,"Main Menu",{fontFamily:"Arial Black",fontSize:38,color:"#ffffff",stroke:"#000000",strokeThickness:8,align:"center"}).setOrigin(.5),this.scene.start("Game")}}class x extends s.Scene{constructor(){super("Preloader")}init(){this.add.image(512,384,"background"),this.add.rectangle(512,384,468,32).setStrokeStyle(1,16777215);const t=this.add.rectangle(282,384,4,28,16777215);this.load.on("progress",(e=>{t.width=4+460*e}))}preload(){this.load.setPath("assets")}create(){this.scene.start("MainMenu")}}const C={type:Phaser.AUTO,parent:"game-container",backgroundColor:"#000",pixelArt:!0,width:window.innerWidth,height:window.innerHeight,scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:"arcade",arcade:{gravity:{x:0,y:0},debug:!0}},scene:[i,x,S,k,a]};new s.Game(C);