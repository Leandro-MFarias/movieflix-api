import express from "express"
import { PrismaClient } from "@prisma/client"


const port = 3000
const app = express()
const prisma = new PrismaClient()

app.use(express.json())

app.get('/movies', async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: 'asc',
        },
        include: {
            genres: true,
            languages: true,
        }
    })
    res.json(movies)
})

app.post("/movies", async (req, res) => {
    const { title, genre_id, language_id, oscar_count, release_date } = req.body

    try {
        // Case insensitive - se a busca for feita por john wick ou John Wick ou JOHN WICK, o registro vai ser retornado na consulta

        // Case sensitive - se buscar por john wick e no banco estiver como John Wick, não vai ser retornado na consulta

        const movieWithSameTitle = await prisma.movie.findFirst({
            where: { title: { equals: title, mode: "insensitive" } }
        })

        if (movieWithSameTitle) {
            res.status(409).send({ message: "Já existe um filme cadastrado com esse título" })
        }

        await prisma.movie.create({
            data: {
                title: title,
                genre_id: genre_id,
                language_id: language_id,
                oscar_count: oscar_count,
                release_date: new Date(release_date)
            }
        })
    } catch (error) {
        res.status(500).send({ message: "Falha ao cadastrar um filme" })
    }

    res.status(201).json()
})

app.put('/movies/:id', async (req, res) => {
    // pegar o id do registro que vai ser atualizado
    const id = Number(req.params.id)

    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id
            }
        })
        if (!movie) {
            res.status(404).send({ message: "Filme não encontrado" })
        }

        const data = { ...req.body }
        data.release_date = data.release_date ? new Date(data.release_date) : undefined

        // pegar os dados do filme que será atualizado e atualizar ele no prisma
        await prisma.movie.update({
            where: {
                id
            },
            data: data
        })
    } catch (error) {
        res.status(500).send({ message: "Falha ao atualizar o registo do filme" })
    }
    // retornar o status correto informando que o filme foi atualizado
    res.status(200).send()
})

app.delete('/movies/:id', async (req, res) => {
    const id = Number(req.params.id)

    try {
        const movie = await prisma.movie.findUnique({ where: { id } })
        if (!movie) {
            res.status(404).send({ message: "O Filme não foi encontrado" })
        }

        await prisma.movie.delete({ where: { id } })
    } catch (error) {
        res.status(500).send({ message: "Não foi possível remover o filme" })
    }
    res.status(200).send()
})

app.get("/movies/:genreName", async (req, res) => {
    // Receber o nome gênero pelo parametros da rota

    // Filtrar os filmes do banco pelo genero
    try {
        const moviesFilteredByGenreName = await prisma.movie.findMany({
            include: {
                genres: true,
                languages: true
            },
            where: {
                genres: {
                    name: {
                        equals: req.params.genreName,
                        mode: 'insensitive',
                    }
                }
            }
        })
        // Retornar os filmes filtrados na resposta da rota
        res.status(200).send(moviesFilteredByGenreName)
    } catch (error) {
        res.status(500).send({ message: "Falha ao filtrar filmes por gênero" })
    }
})

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
})