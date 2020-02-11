<script>
    export let books;
    // let allBooks = 0;

    // function sumBooks() {
	// 	allBooks += 1;
	// }

</script>


<style>
    ul{
        list-style: none;
        margin: 1rem;
        padding:0;
    }
    li{
        font-size:1.5rem;
        margin: 1rem;
    }
</style>

<ul>
    {#each books as book}
    <li> {book.title} - {book.pages} pages</li>
    
    {/each}
</ul>

<!-- <h2> Total : </h2> -->